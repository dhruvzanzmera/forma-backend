const Category = require('../models/category.model');
const Product = require('../models/product.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createSlug } = require('../utils/slug.util');

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

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllAdminCategories
};
