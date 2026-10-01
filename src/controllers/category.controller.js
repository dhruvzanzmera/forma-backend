const Category = require('../models/category.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all active categories (Public)
 * Route: GET /api/v1/categories
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return ApiResponse.success(res, categories, 'Categories fetched successfully.');
});

/**
 * Get category by slug or id (Public)
 * Route: GET /api/v1/categories/:slug
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);

  const query = isMongoId ? { _id: slug, isActive: true } : { slug, isActive: true };
  const category = await Category.findOne(query);

  if (!category) {
    throw ApiError.notFound('Category not found.');
  }

  return ApiResponse.success(res, category, 'Category fetched successfully.');
});

module.exports = {
  getCategories,
  getCategoryBySlug
};
