const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
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
router.get('/products', adminController.getAllAdminProducts);
router.post(
  '/products',
  upload.array('images', 5),
  validate(createProductValidator),
  adminController.createProduct
);
router.put(
  '/products/:id',
  upload.array('images', 5),
  validate(updateProductValidator),
  adminController.updateProduct
);
router.patch(
  '/products/:id/stock',
  validate(productIdParamValidator),
  adminController.updateProductStock
);
router.delete(
  '/products/:id',
  validate(productIdParamValidator),
  adminController.deleteProduct
);

// 3. Category Management
router.get('/categories', adminController.getAllAdminCategories);
router.post('/categories', validate(createCategoryValidator), adminController.createCategory);
router.put('/categories/:id', validate(updateCategoryValidator), adminController.updateCategory);
router.delete(
  '/categories/:id',
  validate(categoryIdParamValidator),
  adminController.deleteCategory
);

// 4. Customer Management
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerById);
router.patch('/customers/:id/status', adminController.toggleCustomerStatus);
router.get('/customers/:id/orders', adminController.getCustomerOrders);

// 5. Order Management
router.get('/orders', adminController.getAllOrders);
router.patch(
  '/orders/:id/status',
  validate(updateOrderStatusValidator),
  adminController.updateOrderStatus
);
router.patch(
  '/orders/:id/payment-status',
  validate(updatePaymentStatusValidator),
  adminController.updatePaymentStatus
);

module.exports = router;
