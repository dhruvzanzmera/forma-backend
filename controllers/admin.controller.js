const User = require('../models/user.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Order = require('../models/order.model');
const OrderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { UserRole, OrderStatus } = require('../constants');

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

module.exports = {
  getDashboardStats
};
