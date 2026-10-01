const { body, param } = require('express-validator');

const addToCartValidator = [
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid Product ID format'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be an integer between 1 and 100')
];

const updateCartItemValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid Product ID format'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be an integer between 1 and 100')
];

const removeCartItemValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid Product ID format')
];

module.exports = {
  addToCartValidator,
  updateCartItemValidator,
  removeCartItemValidator
};
