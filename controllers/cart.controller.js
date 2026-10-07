const CartService = require('../services/cart.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get current user's cart
 * Route: GET /api/v1/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const cartData = await CartService.getCart(req.user._id);
  return ApiResponse.success(res, cartData, 'Cart fetched successfully.');
});

/**
 * Add item to cart
 * Route: POST /api/v1/cart/items
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const cartData = await CartService.addToCart(req.user._id, productId, parseInt(quantity, 10));
  return ApiResponse.success(res, cartData, 'Product added to cart successfully.');
});

/**
 * Update cart item quantity
 * Route: PUT /api/v1/cart/items/:productId
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const cartData = await CartService.updateQuantity(req.user._id, productId, parseInt(quantity, 10));
  return ApiResponse.success(res, cartData, 'Cart item updated successfully.');
});

/**
 * Remove item from cart
 * Route: DELETE /api/v1/cart/items/:productId
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cartData = await CartService.removeItem(req.user._id, productId);
  return ApiResponse.success(res, cartData, 'Item removed from cart.');
});

/**
 * Clear cart
 * Route: DELETE /api/v1/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  const cartData = await CartService.clearCart(req.user._id);
  return ApiResponse.success(res, cartData, 'Cart cleared successfully.');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
