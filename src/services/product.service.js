const Product = require('../models/product.model');

class ProductService {
  /**
   * Query products with advanced filtering, searching, sorting, and pagination
   * @param {Object} queryParams 
   * @param {Boolean} includeInactive - Admin view flag
   */
  static async getProducts(queryParams, includeInactive = false) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'newest',
      page = 1,
      limit = 12
    } = queryParams;

    const filter = {};

    // Only active products for customers
    if (!includeInactive) {
      filter.isActive = true;
    } else if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive === 'true';
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Stock availability
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      filter.stock = 0;
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter.price.$lte = Number(maxPrice);
      }
    }

    // Search filter (text or regex)
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { sku: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Sorting
    const sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions.price = 1;
        break;
      case 'price_desc':
        sortOptions.price = -1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'name_asc':
        sortOptions.name = 1;
        break;
      case 'name_desc':
        sortOptions.name = -1;
        break;
      case 'newest':
      default:
        sortOptions.createdAt = -1;
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      products,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    };
  }
}

module.exports = ProductService;
