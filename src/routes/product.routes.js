const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const validate = require('../middleware/validate.middleware');
const { productQueryValidator } = require('../validators/product.validator');

// Public product endpoints
router.get('/', validate(productQueryValidator), productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:idOrSlug', productController.getProductBySlugOrId);

module.exports = router;
