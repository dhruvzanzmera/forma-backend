const Order = require('../models/order.model');
const Product = require('../models/product.model');
const Address = require('../models/address.model');
const Cart = require('../models/cart.model');
const User = require('../models/user.model');
const ApiError = require('../utils/apiError');
const { runTransaction } = require('../utils/transaction.util');
const MailService = require('./mail.service');
const config = require('../config/env');
const { OrderStatus, PaymentStatus, PaymentMethod } = require('../constants');

class OrderService {
  /**
   * Generate a readable unique order number (e.g. ORD-20261001-A9F2)
   */
  static generateOrderNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomHex}`;
  }

  /**
   * Place COD Order:
   * 1. Validate user's cart has items
   * 2. Validate shipping address exists and belongs to user
   * 3. Validate stock & lock/decrement inventory
   * 4. Calculate prices strictly on server
   * 5. Create Order record with snapshot
   * 6. Empty user's cart
   * 7. Trigger async confirmation email
   */
  static async placeCodOrder(userId, addressId) {
    // 1. Fetch address
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw ApiError.notFound('Delivery address not found or does not belong to user');
    }

    // 2. Fetch cart with items
    const cart = await Cart.findOne({ user: userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw ApiError.badRequest('Your cart is empty. Add products before placing an order.');
    }

    // Execute atomic transaction for inventory deduction and order creation
    const createdOrder = await runTransaction(async (session) => {
      const orderItems = [];
      let itemsPrice = 0;

      // Validate stock and prepare snapshots
      for (const item of cart.items) {
        const query = { _id: item.product, isActive: true };
        const product = session
          ? await Product.findOne(query).session(session)
          : await Product.findOne(query);

        if (!product) {
          throw ApiError.badRequest(`One or more products in your cart are no longer available.`);
        }

        if (product.stock < item.quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for "${product.name}". Only ${product.stock} available.`
          );
        }

        const effectivePrice =
          product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
            ? product.discountPrice
            : product.price;

        const subtotal = effectivePrice * item.quantity;
        itemsPrice += subtotal;

        // Deduct inventory atomically
        const updateCond = { _id: product._id, stock: { $gte: item.quantity } };
        const updateOp = { $inc: { stock: -item.quantity } };
        const updatedProduct = session
          ? await Product.findOneAndUpdate(updateCond, updateOp, { session, new: true })
          : await Product.findOneAndUpdate(updateCond, updateOp, { new: true });

        if (!updatedProduct) {
          throw ApiError.badRequest(
            `Inventory check failed for "${product.name}". Please review your cart.`
          );
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: effectivePrice,
          quantity: item.quantity,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          subtotal
        });
      }

      // Server-side calculation of shipping, tax, and total
      const shippingPrice =
        itemsPrice > 0 && itemsPrice < config.business.freeShippingThreshold
          ? config.business.shippingFee
          : 0;
      const taxPrice = Number(((itemsPrice * config.business.taxRatePercentage) / 100).toFixed(2));
      const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

      // Build Order Document
      const orderPayload = {
        orderNumber: OrderService.generateOrderNumber(),
        user: userId,
        items: orderItems,
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country
        },
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PENDING,
        itemsPrice: Number(itemsPrice.toFixed(2)),
        shippingPrice,
        taxPrice,
        totalPrice
      };

      const newOrder = session
        ? await Order.create([orderPayload], { session }).then((res) => res[0])
        : await Order.create(orderPayload);

      // Clear user cart
      if (session) {
        await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { session });
      } else {
        await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
      }

      return newOrder;
    });

    // Send order confirmation asynchronously
    User.findById(userId)
      .select('name email')
      .then((user) => {
        if (user) {
          MailService.sendOrderConfirmation(createdOrder, user).catch((err) =>
            console.error('[Mail Error] Failed to send order confirmation:', err.message)
          );
        }
      })
      .catch((err) => console.error('[User Lookup Error]', err.message));

    return createdOrder;
  }

  /**
   * Customer Cancel Order
   */
  static async cancelOrder(userId, orderId, reason) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw ApiError.badRequest('This order is already cancelled');
    }

    if (
      [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].includes(
        order.orderStatus
      )
    ) {
      throw ApiError.badRequest(
        `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase().replace(/_/g, ' ')}.`
      );
    }

    // Run transaction to restore inventory and update status
    const updatedOrder = await runTransaction(async (session) => {
      // Restore stock for all items
      for (const item of order.items) {
        if (session) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } },
            { session }
          );
        } else {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          });
        }
      }

      order.orderStatus = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = reason || 'Cancelled by customer';

      return session ? await order.save({ session }) : await order.save();
    });

    // Send email notification
    User.findById(userId)
      .select('name email')
      .then((user) => {
        if (user) {
          MailService.sendOrderStatusUpdate(updatedOrder, user).catch((err) =>
            console.error('[Mail Error] Failed to send cancellation email:', err.message)
          );
        }
      });

    return updatedOrder;
  }

  /**
   * Admin Update Order Status
   */
  static async updateOrderStatus(orderId, newStatus, reason = null) {
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === OrderStatus.CANCELLED) {
      throw ApiError.badRequest('Cancelled order cannot be updated to another status');
    }

    if (previousStatus === OrderStatus.DELIVERED && newStatus !== OrderStatus.DELIVERED) {
      throw ApiError.badRequest('Delivered order status cannot be modified');
    }

    // Handle cancellation: restore stock
    if (newStatus === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
      await runTransaction(async (session) => {
        for (const item of order.items) {
          if (session) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { stock: item.quantity } },
              { session }
            );
          } else {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity }
            });
          }
        }
      });
      order.cancelledAt = new Date();
      order.cancellationReason = reason || 'Cancelled by administrator';
    }

    // If delivered, update delivery date and if COD mark as PAID
    if (newStatus === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      if (order.paymentMethod === PaymentMethod.COD && order.paymentStatus === PaymentStatus.PENDING) {
        order.paymentStatus = PaymentStatus.PAID;
        order.paidAt = new Date();
      }
    }

    order.orderStatus = newStatus;
    await order.save();

    // Notify user via email
    if (order.user && order.user.email) {
      MailService.sendOrderStatusUpdate(order, order.user).catch((err) =>
        console.error('[Mail Error] Status update email failed:', err.message)
      );
    }

    return order;
  }

  /**
   * Admin Update Payment Status
   */
  static async updatePaymentStatus(orderId, paymentStatus) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    order.paymentStatus = paymentStatus;
    if (paymentStatus === PaymentStatus.PAID && !order.paidAt) {
      order.paidAt = new Date();
    }

    await order.save();
    return order;
  }

  /**
   * Get Customer Order History with pagination
   */
  static async getCustomerOrders(userId, queryParams = {}) {
    const { page = 1, limit = 10, status } = queryParams;

    const filter = { user: userId };
    if (status && Object.values(OrderStatus).includes(status)) {
      filter.orderStatus = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      orders,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }

  /**
   * Get Order Details by ID (for customer or admin)
   */
  static async getOrderDetails(orderId, userId = null, isAdmin = false) {
    const filter = { _id: orderId };
    if (!isAdmin && userId) {
      filter.user = userId;
    }

    const order = await Order.findOne(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'slug');

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }
}

module.exports = OrderService;
