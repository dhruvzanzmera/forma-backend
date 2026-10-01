const User = require('../models/user.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const OrderService = require('../services/order.service');
const ProductService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createSlug } = require('../utils/slug.util');
const { UserRole, OrderStatus, PaymentStatus } = require('../constants');

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================

/**
 * Get Admin Dashboard Overview & Analytics
 * Route: GET /api/v1/admin/dashboard
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    totalProducts,
    totalOrders,
    lowStockCount,
    salesData,
    statusBreakdown,
    recentOrders
  ] = await Promise.all([
    // 1. Total active customers
    User.countDocuments({ role: UserRole.CUSTOMER }),

    // 2. Total products
    Product.countDocuments(),

    // 3. Total orders
    Order.countDocuments(),

    // 4. Low stock products (stock <= 5)
    Product.countDocuments({ stock: { $lte: 5 } }),

    // 5. Total delivered / paid sales revenue
    Order.aggregate([
      { $match: { orderStatus: { $ne: OrderStatus.CANCELLED } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          deliveredRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', OrderStatus.DELIVERED] }, '$totalPrice', 0]
            }
          }
        }
      }
    ]),

    // 6. Orders count by status
    Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]),

    // 7. Recent 5 orders
    Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const totalRevenue = salesData[0] ? salesData[0].totalRevenue : 0;
  const deliveredRevenue = salesData[0] ? salesData[0].deliveredRevenue : 0;

  const ordersByStatus = {};
  Object.values(OrderStatus).forEach((status) => {
    ordersByStatus[status] = 0;
  });
  statusBreakdown.forEach((item) => {
    ordersByStatus[item._id] = item.count;
  });

  return ApiResponse.success(
    res,
    {
      overview: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        deliveredRevenue: Number(deliveredRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        totalProducts,
        lowStockCount
      },
      ordersByStatus,
      recentOrders
    },
    'Dashboard statistics retrieved successfully.'
  );
});

// ==========================================
// 2. PRODUCT MANAGEMENT (CRUD)
// ==========================================

/**
 * Create Product with Images
 * Route: POST /api/v1/admin/products
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, stock, category, sku, isFeatured } = req.body;

  // Category verification
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw ApiError.badRequest('Referenced category does not exist.');
  }

  // Base slug
  let slug = createSlug(name);
  const existingProduct = await Product.findOne({ slug });
  if (existingProduct) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // Handle uploaded images from multer
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map((file) => `/uploads/products/${file.filename}`);
  } else if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  const product = await Product.create({
    name,
    slug,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : 0,
    stock: parseInt(stock, 10),
    category,
    images,
    sku: sku ? sku.trim().toUpperCase() : undefined,
    isFeatured: isFeatured === 'true' || isFeatured === true
  });

  const populated = await Product.findById(product._id).populate('category', 'name slug');

  return ApiResponse.created(res, populated, 'Product created successfully.');
});

/**
 * Update Product
 * Route: PUT /api/v1/admin/products/:id
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found.');
  }

  const { name, description, price, discountPrice, stock, category, sku, isActive, isFeatured } =
    req.body;

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw ApiError.badRequest('Referenced category does not exist.');
    }
    product.category = category;
  }

  if (name && name !== product.name) {
    product.name = name;
    let newSlug = createSlug(name);
    const existingSlug = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
    if (existingSlug) {
      newSlug = `${newSlug}-${Date.now().toString().slice(-4)}`;
    }
    product.slug = newSlug;
  }

  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);
  if (stock !== undefined) product.stock = parseInt(stock, 10);
  if (sku !== undefined) product.sku = sku.trim().toUpperCase();
  if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
  if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;

  // Append any newly uploaded images
  if (req.files && req.files.length > 0) {
    const newImageUrls = req.files.map((file) => `/uploads/products/${file.filename}`);
    product.images = [...product.images, ...newImageUrls];
  }

  await product.save();
  const updated = await Product.findById(product._id).populate('category', 'name slug');

  return ApiResponse.success(res, updated, 'Product updated successfully.');
});

/**
 * Update Product Stock directly
 * Route: PATCH /api/v1/admin/products/:id/stock
 */
const updateProductStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || parseInt(stock, 10) < 0) {
    throw ApiError.badRequest('Valid stock number is required (>= 0).');
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: parseInt(stock, 10) },
    { new: true }
  ).populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found.');
  }

  return ApiResponse.success(res, product, 'Product stock updated successfully.');
});

/**
 * Delete Product
 * Route: DELETE /api/v1/admin/products/:id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found.');
  }

  return ApiResponse.noContent(res, 'Product deleted successfully.');
});

/**
 * Admin Get All Products (Includes Inactive)
 * Route: GET /api/v1/admin/products
 */
const getAllAdminProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.getProducts(req.query, true);
  return ApiResponse.success(res, result.products, 'Products retrieved.', 200, result.meta);
});

// ==========================================
// 3. CATEGORY MANAGEMENT (CRUD)
// ==========================================

/**
 * Create Category
 * Route: POST /api/v1/admin/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, isActive } = req.body;

  const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (existingCategory) {
    throw ApiError.conflict('A category with this name already exists.');
  }

  const slug = createSlug(name);

  const category = await Category.create({
    name,
    slug,
    description: description || '',
    image: image || null,
    isActive: isActive !== undefined ? isActive : true
  });

  return ApiResponse.created(res, category, 'Category created successfully.');
});

/**
 * Update Category
 * Route: PUT /api/v1/admin/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw ApiError.notFound('Category not found.');
  }

  const { name, description, image, isActive } = req.body;

  if (name && name !== category.name) {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: category._id }
    });
    if (existing) {
      throw ApiError.conflict('Another category with this name already exists.');
    }
    category.name = name;
    category.slug = createSlug(name);
  }

  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  return ApiResponse.success(res, category, 'Category updated successfully.');
});

/**
 * Delete Category
 * Route: DELETE /api/v1/admin/categories/:id
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const productsWithCategory = await Product.countDocuments({ category: req.params.id });
  if (productsWithCategory > 0) {
    throw ApiError.badRequest(
      `Cannot delete category. There are ${productsWithCategory} products associated with it. Please reassign or delete them first.`
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw ApiError.notFound('Category not found.');
  }

  return ApiResponse.noContent(res, 'Category deleted successfully.');
});

/**
 * Admin Get All Categories
 * Route: GET /api/v1/admin/categories
 */
const getAllAdminCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  return ApiResponse.success(res, categories, 'Categories fetched successfully.');
});

// ==========================================
// 4. CUSTOMER MANAGEMENT
// ==========================================

/**
 * Get All Customers with search & pagination
 * Route: GET /api/v1/admin/customers
 */
const getCustomers = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 10 } = req.query;

  const filter = { role: UserRole.CUSTOMER };

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  if (search && search.trim() !== '') {
    const s = search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(
    res,
    customers,
    'Customers retrieved successfully.',
    200,
    {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  );
});

/**
 * Get Single Customer Details
 * Route: GET /api/v1/admin/customers/:id
 */
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: UserRole.CUSTOMER });
  if (!customer) {
    throw ApiError.notFound('Customer not found.');
  }

  const ordersCount = await Order.countDocuments({ user: customer._id });

  return ApiResponse.success(
    res,
    {
      customer,
      ordersCount
    },
    'Customer details retrieved successfully.'
  );
});

/**
 * Activate or Deactivate Customer Account
 * Route: PATCH /api/v1/admin/customers/:id/status
 */
const toggleCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw ApiError.badRequest('Field isActive must be boolean (true or false).');
  }

  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: UserRole.CUSTOMER },
    { isActive },
    { new: true }
  );

  if (!customer) {
    throw ApiError.notFound('Customer not found.');
  }

  return ApiResponse.success(
    res,
    customer,
    `Customer account has been ${isActive ? 'activated' : 'deactivated'} successfully.`
  );
});

/**
 * Get Customer Orders
 * Route: GET /api/v1/admin/customers/:id/orders
 */
const getCustomerOrders = asyncHandler(async (req, res) => {
  const result = await OrderService.getCustomerOrders(req.params.id, req.query);
  return ApiResponse.success(res, result.orders, 'Customer orders retrieved.', 200, result.meta);
});

// ==========================================
// 5. ORDER MANAGEMENT
// ==========================================

/**
 * Get All Orders (Admin with search, status filters, pagination)
 * Route: GET /api/v1/admin/orders
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus, search, page = 1, limit = 10 } = req.query;

  const filter = {};

  if (orderStatus && Object.values(OrderStatus).includes(orderStatus)) {
    filter.orderStatus = orderStatus;
  }

  if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
    filter.paymentStatus = paymentStatus;
  }

  if (search && search.trim() !== '') {
    filter.orderNumber = { $regex: search.trim(), $options: 'i' };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return ApiResponse.success(res, orders, 'Orders fetched successfully.', 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1
  });
});

/**
 * Update Order Status
 * Route: PATCH /api/v1/admin/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const order = await OrderService.updateOrderStatus(req.params.id, status, reason);
  return ApiResponse.success(res, order, `Order status updated to ${status}.`);
});

/**
 * Update Payment Status
 * Route: PATCH /api/v1/admin/orders/:id/payment-status
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const order = await OrderService.updatePaymentStatus(req.params.id, paymentStatus);
  return ApiResponse.success(res, order, `Payment status updated to ${paymentStatus}.`);
});

module.exports = {
  getDashboardStats,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getAllAdminProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllAdminCategories,
  getCustomers,
  getCustomerById,
  toggleCustomerStatus,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus
};
