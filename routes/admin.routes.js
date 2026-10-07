const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const productController = require('../controllers/product.controller');
const categoryController = require('../controllers/category.controller');
const userController = require('../controllers/user.controller');
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { UserRole } = require('../constants');
const {
  productIdParamValidator,
  createProductValidator,
  updateProductValidator
} = require('../validators/product.validator');
const {
  categoryIdParamValidator,
  createCategoryValidator,
  updateCategoryValidator
} = require('../validators/category.validator');
const {
  orderIdParamValidator,
  updateOrderStatusValidator,
  updatePaymentStatusValidator
} = require('../validators/order.validator');

// All admin routes require authentication and admin role
router.use(protect, authorize(UserRole.ADMIN));

// 1. Dashboard & Analytics
router.get('/dashboard', adminController.getDashboardStats);

// 2. Product Management
router.get('/products', productController.getAllAdminProducts);
router.get('/products/:id', validate(productIdParamValidator), productController.getAdminProductById);
router.post(
  '/products',
  upload.array('images', 5),
  validate(createProductValidator),
  productController.createProduct
);
router.put(
  '/products/:id',
  upload.array('images', 5),
  validate(updateProductValidator),
  productController.updateProduct
);
router.patch(
  '/products/:id/stock',
  validate(productIdParamValidator),
  productController.updateProductStock
);
router.delete(
  '/products/:id',
  validate(productIdParamValidator),
  productController.deleteProduct
);

// 3. Category Management
router.get('/categories', categoryController.getAllAdminCategories);
router.post('/categories', validate(createCategoryValidator), categoryController.createCategory);
router.put('/categories/:id', validate(updateCategoryValidator), categoryController.updateCategory);
router.delete(
  '/categories/:id',
  validate(categoryIdParamValidator),
  categoryController.deleteCategory
);

// 4. Customer Management
router.get('/customers', userController.getCustomers);
router.get('/customers/:id', userController.getCustomerById);
router.patch('/customers/:id/status', userController.toggleCustomerStatus);
router.get('/customers/:id/orders', userController.getCustomerOrders);

// 5. Order Management
router.get('/orders', orderController.getAllOrders);
router.patch(
  '/orders/:id/status',
  validate(updateOrderStatusValidator),
  orderController.updateOrderStatus
);
router.patch(
  '/orders/:id/payment-status',
  validate(updatePaymentStatusValidator),
  orderController.updatePaymentStatus
);

module.exports = router;
