# 📘 Complete E-Commerce API Reference & Payloads Cheatsheet

Base URL: `http://localhost:5000/api/v1`

---

## 📑 Table of Contents
1. [Health Check](#1-health-check)
2. [Authentication & Account Recovery](#2-authentication--account-recovery)
3. [User Profile](#3-user-profile)
4. [Customer Addresses (CRUD)](#4-customer-addresses-crud)
5. [Categories (Public)](#5-categories-public)
6. [Products (Public Catalog)](#6-products-public-catalog)
7. [Shopping Cart](#7-shopping-cart)
8. [Orders & Checkout (Customer)](#8-orders--checkout-customer)
9. [Admin Operations](#9-admin-operations)
   - [Dashboard Analytics](#admin-dashboard-analytics)
   - [Product Management](#admin-product-management)
   - [Category Management](#admin-category-management)
   - [Customer Management](#admin-customer-management)
   - [Order Management](#admin-order-management)

---

## 1. Health Check

### Check Server Health
- **Method**: `GET`
- **URL**: `/health`
- **Auth**: None
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "E-Commerce API is healthy and operational.",
  "data": {
    "status": "UP",
    "uptime": 124.58,
    "timestamp": "2026-09-30T18:00:00.000Z"
  }
}
```

---

## 2. Authentication & Account Recovery

### Register Customer
- **Method**: `POST`
- **URL**: `/auth/register`
- **Auth**: None
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "Password@123",
  "phone": "+919876543210"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful! Please verify your email with the OTP sent to you.",
  "data": {
    "userId": "67f3a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "isEmailVerified": false
  }
}
```

---

### Verify Email OTP
- **Method**: `POST`
- **URL**: `/auth/verify-otp`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "johndoe@example.com",
  "otp": "123456"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67f3a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "role": "customer",
      "isEmailVerified": true
    }
  }
}
```

---

### Resend Verification OTP
- **Method**: `POST`
- **URL**: `/auth/resend-otp`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "johndoe@example.com"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "A new verification OTP has been sent to your email."
}
```

---

### Login (Customer or Admin)
- **Method**: `POST`
- **URL**: `/auth/login`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "johndoe@example.com",
  "password": "Password@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67f3a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "role": "customer",
      "isEmailVerified": true
    }
  }
}
```

---

### Forgot Password (Send OTP)
- **Method**: `POST`
- **URL**: `/auth/forgot-password`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "johndoe@example.com"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If an account exists with this email, an OTP has been sent."
}
```

---

### Reset Password (Verify OTP + Set New Password)
- **Method**: `POST`
- **URL**: `/auth/reset-password`
- **Auth**: None
- **Request Body**:
```json
{
  "email": "johndoe@example.com",
  "otp": "654321",
  "newPassword": "NewStrongPassword@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password has been reset successfully. You can now log in with your new password."
}
```

---

### Change Password (Logged-in user)
- **Method**: `POST`
- **URL**: `/auth/change-password`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "currentPassword": "OldPassword@123",
  "newPassword": "BrandNewPassword@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password updated successfully."
}
```

---

### Logout
- **Method**: `POST`
- **URL**: `/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully."
}
```

---

## 3. User Profile

### Get Current User Profile
- **Method**: `GET`
- **URL**: `/users/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile fetched successfully.",
  "data": {
    "_id": "67f3a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "johndoe@example.com",
    "phone": "+919876543210",
    "role": "customer",
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2026-09-30T10:00:00.000Z",
    "updatedAt": "2026-09-30T10:00:00.000Z"
  }
}
```

---

### Update Profile
- **Method**: `PUT`
- **URL**: `/users/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Johnathan Doe",
  "phone": "+919123456789"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully.",
  "data": {
    "_id": "67f3a1b2c3d4e5f6a7b8c9d0",
    "name": "Johnathan Doe",
    "email": "johndoe@example.com",
    "phone": "+919123456789",
    "role": "customer",
    "isEmailVerified": true
  }
}
```

---

## 4. Customer Addresses (CRUD)

### Get All Addresses
- **Method**: `GET`
- **URL**: `/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Addresses fetched successfully.",
  "data": [
    {
      "_id": "67f3a2b3c4d5e6f7a8b9c0d1",
      "user": "67f3a1b2c3d4e5f6a7b8c9d0",
      "fullName": "John Doe",
      "phone": "+919876543210",
      "street": "Flat 402, Sunset Towers, MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "isDefault": true
    }
  ]
}
```

---

### Get Address by ID
- **Method**: `GET`
- **URL**: `/addresses/:id`
- **Headers**: `Authorization: Bearer <token>`

---

### Create New Address
- **Method**: `POST`
- **URL**: `/addresses`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "fullName": "John Doe",
  "phone": "+919876543210",
  "street": "Flat 402, Sunset Towers, MG Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400001",
  "country": "India",
  "isDefault": true
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Address created successfully.",
  "data": {
    "_id": "67f3a2b3c4d5e6f7a8b9c0d1",
    "fullName": "John Doe",
    "street": "Flat 402, Sunset Towers, MG Road",
    "city": "Mumbai",
    "isDefault": true
  }
}
```

---

### Update Address
- **Method**: `PUT`
- **URL**: `/addresses/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "street": "Apartment 10B, Sunrise Heights",
  "city": "Mumbai",
  "postalCode": "400002",
  "isDefault": false
}
```

---

### Set Default Address
- **Method**: `PATCH`
- **URL**: `/addresses/:id/default`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Default address updated successfully."
}
```

---

### Delete Address
- **Method**: `DELETE`
- **URL**: `/addresses/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Address deleted successfully."
}
```

---

## 5. Categories (Public)

### Get All Active Categories
- **Method**: `GET`
- **URL**: `/categories`
- **Auth**: None
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories fetched successfully.",
  "data": [
    {
      "_id": "67f3a3b4c5d6e7f8a9b0c1d2",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Smartphones, Laptops and Accessories",
      "image": "/uploads/categories/electronics.png",
      "isActive": true
    }
  ]
}
```

---

### Get Category Details
- **Method**: `GET`
- **URL**: `/categories/:slug` (slug or mongoId)
- **Auth**: None

---

## 6. Products (Public Catalog)

### Browse / Search / Filter / Paginate Products
- **Method**: `GET`
- **URL**: `/products`
- **Auth**: None
- **Query Parameters**:
  - `search`: Keyword (e.g. `wireless`)
  - `category`: Category MongoId
  - `minPrice`: e.g. `50`
  - `maxPrice`: e.g. `500`
  - `inStock`: `true` | `false`
  - `featured`: `true` | `false`
  - `sort`: `newest` | `oldest` | `price_asc` | `price_desc` | `name_asc` | `name_desc`
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `12`)
- **Example URL**: `/products?search=headphones&minPrice=100&maxPrice=300&sort=price_asc&page=1&limit=10`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products fetched successfully.",
  "data": [
    {
      "_id": "67f3a4b5c6d7e8f9a0b1c2d3",
      "name": "Wireless Noise Cancelling Headphones",
      "slug": "wireless-noise-cancelling-headphones",
      "description": "High-fidelity sound with 30-hour battery life.",
      "price": 249.99,
      "discountPrice": 199.99,
      "effectivePrice": 199.99,
      "stock": 25,
      "category": {
        "_id": "67f3a3b4c5d6e7f8a9b0c1d2",
        "name": "Electronics",
        "slug": "electronics"
      },
      "images": [
        "/uploads/products/product-1712000000000-12345.webp"
      ],
      "isFeatured": true,
      "isActive": true
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### Get Featured Products
- **Method**: `GET`
- **URL**: `/products/featured?limit=8`
- **Auth**: None

---

### Get Single Product by Slug or ID
- **Method**: `GET`
- **URL**: `/products/:idOrSlug`
- **Auth**: None
- **Example URL**: `/products/wireless-noise-cancelling-headphones`

---

## 7. Shopping Cart

### Get Cart
- **Method**: `GET`
- **URL**: `/cart`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cart fetched successfully.",
  "data": {
    "cartId": "67f3a5b6c7d8e9f0a1b2c3d4",
    "items": [
      {
        "_id": "67f3a6b7c8d9e0f1a2b3c4d5",
        "productId": "67f3a4b5c6d7e8f9a0b1c2d3",
        "name": "Wireless Noise Cancelling Headphones",
        "slug": "wireless-noise-cancelling-headphones",
        "image": "/uploads/products/product-1.webp",
        "price": 199.99,
        "originalPrice": 249.99,
        "quantity": 2,
        "availableStock": 25,
        "isOutOfStock": false,
        "isQuantityExceeded": false,
        "subtotal": 399.98
      }
    ],
    "itemsCount": 2,
    "summary": {
      "itemsPrice": 399.98,
      "shippingPrice": 50,
      "taxPrice": 20.00,
      "totalPrice": 469.98
    },
    "hasStockIssue": false
  }
}
```

---

### Add Item to Cart
- **Method**: `POST`
- **URL**: `/cart/items`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "productId": "67f3a4b5c6d7e8f9a0b1c2d3",
  "quantity": 2
}
```

---

### Update Item Quantity in Cart
- **Method**: `PUT`
- **URL**: `/cart/items/:productId`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "quantity": 3
}
```

---

### Remove Item from Cart
- **Method**: `DELETE`
- **URL**: `/cart/items/:productId`
- **Headers**: `Authorization: Bearer <token>`

---

### Clear Entire Cart
- **Method**: `DELETE`
- **URL**: `/cart`
- **Headers**: `Authorization: Bearer <token>`

---

## 8. Orders & Checkout (Customer)

### Get Checkout Summary (Price & Stock Validation)
- **Method**: `GET`
- **URL**: `/orders/checkout-summary?addressId=67f3a2b3c4d5e6f7a8b9c0d1`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Checkout summary calculated successfully.",
  "data": {
    "cart": {
      "items": [ /* items */ ],
      "summary": {
        "itemsPrice": 399.98,
        "shippingPrice": 50,
        "taxPrice": 20.00,
        "totalPrice": 469.98
      }
    },
    "shippingAddress": {
      "_id": "67f3a2b3c4d5e6f7a8b9c0d1",
      "fullName": "John Doe",
      "phone": "+919876543210",
      "street": "Flat 402, Sunset Towers, MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "paymentMethod": "COD",
    "isReadyForCheckout": true
  }
}
```

---

### Place Cash On Delivery (COD) Order
- **Method**: `POST`
- **URL**: `/orders`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "addressId": "67f3a2b3c4d5e6f7a8b9c0d1",
  "paymentMethod": "COD"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order placed successfully! Cash on Delivery confirmed.",
  "data": {
    "_id": "67f3a7b8c9d0e1f2a3b4c5d6",
    "orderNumber": "ORD-20261001-A9F2",
    "user": "67f3a1b2c3d4e5f6a7b8c9d0",
    "items": [
      {
        "product": "67f3a4b5c6d7e8f9a0b1c2d3",
        "name": "Wireless Noise Cancelling Headphones",
        "price": 199.99,
        "quantity": 2,
        "image": "/uploads/products/product-1.webp",
        "subtotal": 399.98
      }
    ],
    "shippingAddress": {
      "fullName": "John Doe",
      "phone": "+919876543210",
      "street": "Flat 402, Sunset Towers, MG Road",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "paymentMethod": "COD",
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING",
    "itemsPrice": 399.98,
    "shippingPrice": 50,
    "taxPrice": 20.00,
    "totalPrice": 469.98,
    "createdAt": "2026-10-01T08:30:00.000Z"
  }
}
```

---

### Get My Orders
- **Method**: `GET`
- **URL**: `/orders/my-orders?page=1&limit=10&status=PENDING`
- **Headers**: `Authorization: Bearer <token>`

---

### Get Single Order Details
- **Method**: `GET`
- **URL**: `/orders/:id`
- **Headers**: `Authorization: Bearer <token>`

---

### Cancel Order
- **Method**: `POST`
- **URL**: `/orders/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "reason": "Ordered wrong color variant"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order cancelled successfully.",
  "data": {
    "_id": "67f3a7b8c9d0e1f2a3b4c5d6",
    "orderStatus": "CANCELLED",
    "cancellationReason": "Ordered wrong color variant",
    "cancelledAt": "2026-10-01T09:00:00.000Z"
  }
}
```

---

### Track Order Milestones
- **Method**: `GET`
- **URL**: `/orders/:id/track`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order tracking information fetched.",
  "data": {
    "orderNumber": "ORD-20261001-A9F2",
    "orderStatus": "PROCESSING",
    "paymentStatus": "PENDING",
    "paymentMethod": "COD",
    "isCancelled": false,
    "deliveredAt": null,
    "cancelledAt": null,
    "timeline": [
      { "status": "PENDING", "label": "Order Placed", "isCompleted": true, "isCurrent": false },
      { "status": "CONFIRMED", "label": "Order Confirmed", "isCompleted": true, "isCurrent": false },
      { "status": "PROCESSING", "label": "Processing", "isCompleted": true, "isCurrent": true },
      { "status": "SHIPPED", "label": "Shipped", "isCompleted": false, "isCurrent": false },
      { "status": "OUT_FOR_DELIVERY", "label": "Out For Delivery", "isCompleted": false, "isCurrent": false },
      { "status": "DELIVERED", "label": "Delivered", "isCompleted": false, "isCurrent": false }
    ]
  }
}
```

---

## 9. Admin Operations

*All Admin routes require `Authorization: Bearer <token>` where user has `role: "admin"`.*

---

### Admin Dashboard Analytics
- **Method**: `GET`
- **URL**: `/admin/dashboard`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard statistics retrieved successfully.",
  "data": {
    "overview": {
      "totalRevenue": 15420.50,
      "deliveredRevenue": 12800.00,
      "totalOrders": 48,
      "totalCustomers": 120,
      "totalProducts": 35,
      "lowStockCount": 3
    },
    "ordersByStatus": {
      "PENDING": 5,
      "CONFIRMED": 8,
      "PROCESSING": 10,
      "SHIPPED": 6,
      "OUT_FOR_DELIVERY": 4,
      "DELIVERED": 12,
      "CANCELLED": 3
    },
    "recentOrders": [ /* 5 latest orders */ ]
  }
}
```

---

### Admin Product Management

#### 1. Get All Products (Includes Inactive)
- **Method**: `GET`
- **URL**: `/admin/products?page=1&limit=20&search=keyboard&isActive=true`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 2. Create Product (with Image Upload)
- **Method**: `POST`
- **URL**: `/admin/products`
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: multipart/form-data`
- **Form Data Fields**:
  - `name`: Mechanical Gaming Keyboard
  - `description`: RGB backlit mechanical keyboard with blue switches.
  - `price`: 89.99
  - `discountPrice`: 69.99
  - `stock`: 50
  - `category`: 67f3a3b4c5d6e7f8a9b0c1d2
  - `sku`: KB-MECH-RGB-01
  - `isFeatured`: true
  - `images`: (file upload - up to 5 images: jpg, png, webp)

#### 3. Update Product
- **Method**: `PUT`
- **URL**: `/admin/products/:id`
- **Headers**:
  - `Authorization: Bearer <admin_token>`
  - `Content-Type: multipart/form-data` (or `application/json` if no new files)
- **Request Body (JSON or Form-Data)**:
```json
{
  "price": 79.99,
  "discountPrice": 59.99,
  "stock": 40,
  "isActive": true
}
```

#### 4. Update Product Stock Level Directly
- **Method**: `PATCH`
- **URL**: `/admin/products/:id/stock`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "stock": 100
}
```

#### 5. Delete Product
- **Method**: `DELETE`
- **URL**: `/admin/products/:id`
- **Headers**: `Authorization: Bearer <admin_token>`

---

### Admin Category Management

#### 1. Get All Categories
- **Method**: `GET`
- **URL**: `/admin/categories`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 2. Create Category
- **Method**: `POST`
- **URL**: `/admin/categories`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "name": "Home Appliances",
  "description": "Kitchen and household electronics",
  "image": "https://example.com/images/home.jpg",
  "isActive": true
}
```

#### 3. Update Category
- **Method**: `PUT`
- **URL**: `/admin/categories/:id`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "name": "Smart Home Appliances",
  "isActive": true
}
```

#### 4. Delete Category
- **Method**: `DELETE`
- **URL**: `/admin/categories/:id`
- **Headers**: `Authorization: Bearer <admin_token>`

---

### Admin Customer Management

#### 1. Get All Customers (Search & Paginate)
- **Method**: `GET`
- **URL**: `/admin/customers?search=john&isActive=true&page=1&limit=10`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 2. Get Single Customer Profile & Order Count
- **Method**: `GET`
- **URL**: `/admin/customers/:id`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 3. Activate or Deactivate Customer
- **Method**: `PATCH`
- **URL**: `/admin/customers/:id/status`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "isActive": false
}
```

#### 4. Get Customer's Order History
- **Method**: `GET`
- **URL**: `/admin/customers/:id/orders?page=1&limit=10`
- **Headers**: `Authorization: Bearer <admin_token>`

---

### Admin Order Management

#### 1. Get All Store Orders (Search & Filter)
- **Method**: `GET`
- **URL**: `/admin/orders?orderStatus=PENDING&paymentStatus=PENDING&search=ORD-2026&page=1&limit=15`
- **Headers**: `Authorization: Bearer <admin_token>`

#### 2. Update Order Status
- **Method**: `PATCH`
- **URL**: `/admin/orders/:id/status`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Allowed Statuses**: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`
- **Request Body**:
```json
{
  "status": "CONFIRMED",
  "reason": null
}
```
*(Note: If status is updated to `CANCELLED`, order stock is automatically returned to inventory. If updated to `DELIVERED` for COD orders, payment status is updated to `PAID`.)*

#### 3. Update Payment Status
- **Method**: `PATCH`
- **URL**: `/admin/orders/:id/payment-status`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Allowed Payment Statuses**: `PENDING`, `PAID`, `FAILED`, `REFUNDED`
- **Request Body**:
```json
{
  "paymentStatus": "PAID"
}
```

---

## 🔒 Status Enums Quick Reference

### Order Status Flow
```
PENDING ──▶ CONFIRMED ──▶ PROCESSING ──▶ SHIPPED ──▶ OUT_FOR_DELIVERY ──▶ DELIVERED
   │           │             │
   └───────────┴─────────────┴────▶ CANCELLED (Restores Stock)
```

### Payment Statuses
- `PENDING`
- `PAID`
- `FAILED`
- `REFUNDED`
