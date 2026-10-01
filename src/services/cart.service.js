const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

class CartService {
  /**
   * Get user's cart populated with live product data, pricing, and stock checks
   * @param {string} userId 
   */
  static async getCart(userId) {
    let cart = await Cart.findOne({ user: userId }).populate({
      path: 'items.product',
      select: 'name slug price discountPrice stock images isActive'
    });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      return {
        cartId: cart._id,
        items: [],
        itemsCount: 0,
        summary: {
          itemsPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: 0
        },
        hasStockIssue: false
      };
    }

    // Filter out items where product was deleted or deactivated
    const validItems = [];
    let hasStockIssue = false;

    for (const item of cart.items) {
      if (item.product && item.product.isActive) {
        const prod = item.product;
        const currentEffectivePrice =
          prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price
            ? prod.discountPrice
            : prod.price;

        const isOutOfStock = prod.stock <= 0;
        const isQuantityExceeded = item.quantity > prod.stock;

        if (isOutOfStock || isQuantityExceeded) {
          hasStockIssue = true;
        }

        validItems.push({
          _id: item._id,
          productId: prod._id,
          name: prod.name,
          slug: prod.slug,
          image: prod.images && prod.images.length > 0 ? prod.images[0] : null,
          price: currentEffectivePrice,
          originalPrice: prod.price,
          quantity: item.quantity,
          availableStock: prod.stock,
          isOutOfStock,
          isQuantityExceeded,
          subtotal: currentEffectivePrice * item.quantity
        });
      }
    }

    // If items were modified due to missing products, sync DB
    if (validItems.length !== cart.items.length) {
      cart.items = cart.items.filter((item) => item.product && item.product.isActive);
      await cart.save();
    }

    const itemsPrice = validItems.reduce((acc, item) => acc + item.subtotal, 0);
    const shippingPrice =
      itemsPrice > 0 && itemsPrice < config.business.freeShippingThreshold
        ? config.business.shippingFee
        : 0;
    const taxPrice = Number(((itemsPrice * config.business.taxRatePercentage) / 100).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));
    const itemsCount = validItems.reduce((acc, item) => acc + item.quantity, 0);

    return {
      cartId: cart._id,
      items: validItems,
      itemsCount,
      summary: {
        itemsPrice: Number(itemsPrice.toFixed(2)),
        shippingPrice,
        taxPrice,
        totalPrice
      },
      hasStockIssue
    };
  }

  /**
   * Add a product to the user's cart
   */
  static async addToCart(userId, productId, quantity) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product not found or is currently unavailable');
    }

    if (product.stock <= 0) {
      throw ApiError.badRequest('This product is currently out of stock');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    const effectivePrice =
      product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    let targetQuantity = quantity;

    if (existingIndex > -1) {
      targetQuantity = cart.items[existingIndex].quantity + quantity;
      if (targetQuantity > product.stock) {
        throw ApiError.badRequest(
          `Cannot add ${quantity} more. Total requested (${targetQuantity}) exceeds available stock (${product.stock}).`
        );
      }
      cart.items[existingIndex].quantity = targetQuantity;
      cart.items[existingIndex].priceAtAddition = effectivePrice;
    } else {
      if (targetQuantity > product.stock) {
        throw ApiError.badRequest(
          `Cannot add ${quantity} items. Available stock is ${product.stock}.`
        );
      }
      cart.items.push({
        product: productId,
        quantity: targetQuantity,
        priceAtAddition: effectivePrice
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Update quantity of a specific item in the cart
   */
  static async updateQuantity(userId, productId, quantity) {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw ApiError.notFound('Product not found or unavailable');
    }

    if (quantity > product.stock) {
      throw ApiError.badRequest(
        `Requested quantity (${quantity}) exceeds available stock (${product.stock}).`
      );
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      throw ApiError.notFound('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  static async removeItem(userId, productId) {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      throw ApiError.notFound('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId.toString()
    );

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(userId) {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return { items: [], itemsCount: 0 };
  }
}

module.exports = CartService;
