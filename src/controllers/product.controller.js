const Product = require('../models/product.model');
const ProductService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get products (Public: browse/search/filter/sort/paginate)
 * Route: GET /api/v1/products
 */
const getProducts = asyncHandler(async (req, res) => {
  const result = await ProductService.getProducts(req.query, false);
  return ApiResponse.success(
    res,
    result.products,
    'Products fetched successfully.',
    200,
    result.meta
  );
});

/**
 * Get single product by slug or Mongo ID (Public)
 * Route: GET /api/v1/products/:idOrSlug
 */
const getProductBySlugOrId = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isMongoId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const query = isMongoId
    ? { _id: idOrSlug, isActive: true }
    : { slug: idOrSlug, isActive: true };

  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  if (!product) {
    throw ApiError.notFound('Product not found or unavailable.');
  }

  return ApiResponse.success(res, product, 'Product fetched successfully.');
});

/**
 * Get featured products (Public)
 * Route: GET /api/v1/products/featured
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(20, parseInt(req.query.limit, 10) || 8);
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .lean({ virtuals: true });

  return ApiResponse.success(res, products, 'Featured products fetched successfully.');
});

module.exports = {
  getProducts,
  getProductBySlugOrId,
  getFeaturedProducts
};
