const User = require('../models/user.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = {
  getProfile,
  updateProfile
};
