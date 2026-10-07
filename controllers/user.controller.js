const User = require('../models/user.model');
const Order = require('../models/order.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const OrderService = require('../services/order.service');
const { UserRole } = require('../constants');

/**
 * Get current user profile
 * Route: GET /api/v1/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return ApiResponse.success(res, user, 'Profile fetched successfully.');
});

/**
 * Update current user profile
 * Route: PUT /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  return ApiResponse.success(res, user, 'Profile updated successfully.');
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

module.exports = {
  getProfile,
  updateProfile,
  getCustomers,
  getCustomerById,
  toggleCustomerStatus,
  getCustomerOrders
};
