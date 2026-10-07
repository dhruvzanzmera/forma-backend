const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator
} = require('../validators/cart.validator');

router.use(protect);

router.get('/', cartController.getCart);
router.post('/items', validate(addToCartValidator), cartController.addToCart);
router.put('/items/:productId', validate(updateCartItemValidator), cartController.updateCartItem);
router.delete('/items/:productId', validate(removeCartItemValidator), cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
