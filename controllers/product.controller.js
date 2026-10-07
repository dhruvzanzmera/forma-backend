const Product = require('../models/product.model');
const Category = require('../models/category.model');
const ProductService = require('../services/product.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { createSlug } = require('../utils/slug.util');

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

  const uploadedImages = (req.files || []).map((file) => `/uploads/products/${file.filename}`);
  if (req.body.existingImages !== undefined) {
    let existingImages;
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch (error) {
      throw ApiError.badRequest('Existing product images must be a valid JSON array.');
    }

    if (!Array.isArray(existingImages) || existingImages.some((image) => typeof image !== 'string')) {
      throw ApiError.badRequest('Existing product images must be a valid JSON array.');
    }

    product.images = [...existingImages, ...uploadedImages];
  } else if (uploadedImages.length > 0) {
    // Keep the existing images for clients that only upload additional files.
    product.images = [...product.images, ...uploadedImages];
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

/**
 * Get a product for the admin editor, including inactive products.
 * Route: GET /api/v1/admin/products/:id
 */
const getAdminProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) {
    throw ApiError.notFound('Product not found.');
  }

  return ApiResponse.success(res, product, 'Product retrieved successfully.');
});

module.exports = {
  getProducts,
  getProductBySlugOrId,
  getFeaturedProducts,
  getAllAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct
};
