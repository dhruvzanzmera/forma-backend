const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Category = require('../src/models/category.model');
const Product = require('../src/models/product.model');
const Address = require('../src/models/address.model');
const Order = require('../src/models/order.model');
const Cart = require('../src/models/cart.model');
const connectDB = require('../src/config/db');
const { UserRole, OrderStatus, PaymentStatus } = require('../src/constants');

let adminToken;
let customerToken;
let customerUser;
let testCategory;
let testProduct;
let testAddress;

beforeAll(async () => {
  await connectDB();

  // Clean test artifacts
  await User.deleteMany({ email: { $in: ['testadmin@ecommerce.com', 'testbuyer@ecommerce.com'] } });
  await Category.deleteMany({ slug: 'test-electronics' });

  // Create admin
  const admin = await User.create({
    name: 'Test Admin',
    email: 'testadmin@ecommerce.com',
    password: 'Password123!',
    role: UserRole.ADMIN,
    isEmailVerified: true,
    isActive: true
  });
  adminToken = admin.generateAuthToken();

  // Create customer
  customerUser = await User.create({
    name: 'Test Customer',
    email: 'testbuyer@ecommerce.com',
    password: 'Password123!',
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isActive: true
  });
  customerToken = customerUser.generateAuthToken();
});

afterAll(async () => {
  if (testProduct) await Product.findByIdAndDelete(testProduct._id);
  if (testCategory) await Category.findByIdAndDelete(testCategory._id);
  if (testAddress) await Address.findByIdAndDelete(testAddress._id);
  await Order.deleteMany({ user: customerUser._id });
  await Cart.deleteMany({ user: customerUser._id });
  await User.deleteMany({ email: { $in: ['testadmin@ecommerce.com', 'testbuyer@ecommerce.com'] } });
  await mongoose.connection.close();
});

describe('E-Commerce End-to-End Workflow', () => {
  // 1. Admin Category & Product Management
  it('Admin should create a category', async () => {
    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Electronics',
        description: 'Electronic items and gadgets'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('test-electronics');
    testCategory = res.body.data;
  });

  it('Admin should create a product', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Noise Cancelling Headphones',
        description: 'Premium wireless headphones with ANC',
        price: 200,
        discountPrice: 150,
        stock: 10,
        category: testCategory._id,
        isFeatured: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stock).toBe(10);
    testProduct = res.body.data;
  });

  // 2. Public Browsing
  it('Public user should browse and find the product', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .query({ search: 'Headphones' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // 3. Address Management
  it('Customer should create a shipping address', async () => {
    const res = await request(app)
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Test Buyer',
        phone: '9876543210',
        street: '42 Baker Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDefault).toBe(true);
    testAddress = res.body.data;
  });

  // 4. Cart Lifecycle & Stock Validation
  it('Customer should add product to cart', async () => {
    const res = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProduct._id,
        quantity: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.itemsCount).toBe(2);
    expect(res.body.data.summary.itemsPrice).toBe(300); // 150 * 2
  });

  it('Checkout summary should calculate server-side pricing', async () => {
    const res = await request(app)
      .get('/api/v1/orders/checkout-summary')
      .set('Authorization', `Bearer ${customerToken}`)
      .query({ addressId: testAddress._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isReadyForCheckout).toBe(true);
    expect(res.body.data.cart.items.length).toBe(1);
  });

  // 5. COD Order Placement & Inventory Reduction
  let placedOrder;
  it('Customer should place Cash on Delivery (COD) order', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        addressId: testAddress._id,
        paymentMethod: 'COD'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe(OrderStatus.PENDING);
    expect(res.body.data.paymentStatus).toBe(PaymentStatus.PENDING);
    placedOrder = res.body.data;

    // Verify stock was reduced from 10 to 8
    const updatedProduct = await Product.findById(testProduct._id);
    expect(updatedProduct.stock).toBe(8);

    // Verify customer cart was cleared
    const cart = await Cart.findOne({ user: customerUser._id });
    expect(cart.items.length).toBe(0);
  });

  // 6. Order Tracking & Timeline
  it('Customer should track order status milestones', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${placedOrder._id}/track`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe(OrderStatus.PENDING);
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
  });

  // 7. Order Cancellation & Stock Restoration
  it('Customer should cancel order and stock must be restored', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${placedOrder._id}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Changed my mind' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe(OrderStatus.CANCELLED);

    // Stock should be restored back from 8 to 10
    const restoredProduct = await Product.findById(testProduct._id);
    expect(restoredProduct.stock).toBe(10);
  });

  // 8. Admin Dashboard Analytics
  it('Admin dashboard should display live operational statistics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overview).toHaveProperty('totalOrders');
    expect(res.body.data.overview).toHaveProperty('totalCustomers');
    expect(res.body.data.overview).toHaveProperty('totalProducts');
  });
});
