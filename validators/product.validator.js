const { body, param, query } = require('express-validator');

const productIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Product ID format')
];

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Product description is required'),
  body('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be an integer >= 0'),
  body('category')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID'),
  body('sku')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean')
];

const updateProductValidator = [
  ...productIdParamValidator,
  body('existingImages')
    .optional()
    .isJSON()
    .withMessage('Existing product images must be a valid JSON array')
    .bail()
    .custom((value) => {
      const images = JSON.parse(value);
      return Array.isArray(images) && images.every((image) => typeof image === 'string');
    })
    .withMessage('Existing product images must be a JSON array of strings'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be an integer >= 0'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID'),
  body('sku')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean')
];

const productQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be >= 0'),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be >= 0'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID'),
  query('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be true or false')
];

module.exports = {
  productIdParamValidator,
  createProductValidator,
  updateProductValidator,
  productQueryValidator
};
