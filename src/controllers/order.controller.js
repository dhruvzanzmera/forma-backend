const OrderService = require('../services/order.service');
const CartService = require('../services/cart.service');
const Address = require('../models/address.model');
const Order = require('../models/order.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { OrderStatus } = require('../constants');

/**
 * Checkout Summary & Validation before placing order
 * Route: GET /api/v1/orders/checkout-summary
 */
const getCheckoutSummary = asyncHandler(async (req, res) => {
  const { addressId } = req.query;

  const cartData = await CartService.getCart(req.user._id);

  if (cartData.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty.');
  }

  if (cartData.hasStockIssue) {
    throw ApiError.badRequest(
      'Some items in your cart exceed available stock. Please update your cart before checking out.'
    );
  }

  let selectedAddress = null;
  if (addressId) {
    selectedAddress = await Address.findOne({ _id: addressId, user: req.user._id });
  } else {
    selectedAddress = await Address.findOne({ user: req.user._id, isDefault: true });
    if (!selectedAddress) {
      selectedAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    }
  }

  return ApiResponse.success(
    res,
    {
      cart: cartData,
      shippingAddress: selectedAddress,
      paymentMethod: 'COD',
      isReadyForCheckout: Boolean(selectedAddress && !cartData.hasStockIssue)
    },
    'Checkout summary calculated successfully.'
  );
});

/**
 * Place Order (COD)
 * Route: POST /api/v1/orders
 */
const placeOrder = asyncHandler(async (req, res) => {
  const { addressId } = req.body;

  const order = await OrderService.placeCodOrder(req.user._id, addressId);

  return ApiResponse.created(
    res,
    order,
    'Order placed successfully! Cash on Delivery confirmed.'
  );
});

/**
 * Get My Order History
 * Route: GET /api/v1/orders/my-orders
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const result = await OrderService.getCustomerOrders(req.user._id, req.query);
  return ApiResponse.success(
    res,
    result.orders,
    'Order history fetched successfully.',
    200,
    result.meta
  );
});

/**
 * Get Single Order Details
 * Route: GET /api/v1/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await OrderService.getOrderDetails(req.params.id, req.user._id, false);
  return ApiResponse.success(res, order, 'Order details fetched successfully.');
});

/**
 * Cancel Order
 * Route: POST /api/v1/orders/:id/cancel
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const cancelledOrder = await OrderService.cancelOrder(req.user._id, req.params.id, reason);
  return ApiResponse.success(res, cancelledOrder, 'Order cancelled successfully.');
});

/**
 * Track Order Status
 * Route: GET /api/v1/orders/:id/track
 */
const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).select(
    'orderNumber orderStatus paymentStatus paymentMethod deliveredAt cancelledAt createdAt'
  );

  if (!order) {
    throw ApiError.notFound('Order not found.');
  }

  // Milestones timeline
  const milestones = [
    { status: OrderStatus.PENDING, label: 'Order Placed' },
    { status: OrderStatus.CONFIRMED, label: 'Order Confirmed' },
    { status: OrderStatus.PROCESSING, label: 'Processing' },
    { status: OrderStatus.SHIPPED, label: 'Shipped' },
    { status: OrderStatus.OUT_FOR_DELIVERY, label: 'Out For Delivery' },
    { status: OrderStatus.DELIVERED, label: 'Delivered' }
  ];

  const statusOrder = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED
  ];

  const currentIndex = statusOrder.indexOf(order.orderStatus);

  const trackingTimeline = milestones.map((m, idx) => ({
    ...m,
    isCompleted: order.orderStatus === OrderStatus.CANCELLED ? false : idx <= currentIndex,
    isCurrent: order.orderStatus === m.status
  }));

  return ApiResponse.success(
    res,
    {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      isCancelled: order.orderStatus === OrderStatus.CANCELLED,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      timeline: trackingTimeline
    },
    'Order tracking information fetched.'
  );
});

module.exports = {
  getCheckoutSummary,
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  trackOrder
};
