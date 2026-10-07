# Production-Ready E-Commerce REST API Backend

A complete, production-ready, modular E-Commerce RESTful Backend built with **Node.js, Express.js, MongoDB, and Mongoose**. Designed with a clean MVC/Service-oriented architecture, comprehensive customer and admin capabilities, robust security, server-side price/stock validations, Cash on Delivery (COD) workflows, transactional inventory management, and automated email notifications with Nodemailer.

---

## 🚀 Key Features

### 👤 Customer Features
- **Authentication**: Register, Login, and Logout using JWT tokens.
- **Email OTP Verification**: 6-digit numeric OTP generation, bcrypt-hashing in DB, expiration enforcement, and resend cooldowns.
- **Password Recovery & Security**: Forgot password via OTP verification, secure password reset, and authenticated password change.
- **Profile Management**: View and update customer profile details (name, phone).
- **Address Book (CRUD)**: Create, view, update, delete delivery addresses with automatic default address assignment.
- **Product Catalog**: Browse, search (full-text/regex), filter (by category, price range, stock, featured), sort (by price, date, name), and paginate products.
- **Categories**: Browse active product categories.
- **Shopping Cart**: Add to cart, update quantities, remove items, clear cart with real-time stock availability and server-side pricing.
- **Checkout & COD Orders**: Real-time checkout preview, server-calculated taxes, shipping fees, and inventory reduction via atomic operations and MongoDB transactions.
- **Order Tracking & History**: View order history, detailed order invoices, step-by-step order tracking timeline, and customer cancellation (with stock restoration).

### 🛠️ Admin Features
- **Role-Based Authorization**: Protected endpoints strictly authorized for `admin` role.
- **Admin Seeder**: One-command seed script (`npm run seed:admin`) reading admin credentials from `.env`.
- **Executive Dashboard & Analytics**: Total revenue, delivered revenue, order volume, total customers, low-stock alerts, order status distribution, and recent orders.
- **Product Management (CRUD)**: Create products with multiple image uploads (Multer), update details, manage stock count directly, and delete products.
- **Category Management (CRUD)**: Create, update, toggle active status, and delete categories with referential integrity checks.
- **Customer Management**: View customer directory with search and pagination, view order history per customer, and activate/deactivate accounts.
- **Order Management**: Search, filter, and paginate all store orders; update order statuses (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`); update payment status (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).

### 🔒 Security & Architecture
- **JWT Authentication**: Secure token verification via `Authorization: Bearer <token>`.
- **Bcrypt Password & OTP Hashing**: Sensitive data is always hashed and stripped from JSON serialization (`select: false`).
- **Input Validation**: Strict request schema validation powered by `express-validator`.
- **Security Headers & CORS**: Integrated with `helmet` and configurable `cors`.
- **File Upload Security**: Multer configuration enforcing mime-type whitelisting (JPEG, JPG, PNG, WEBP) and file size limits.
- **Centralized Error Handling**: Unified operational `ApiError` class with standard HTTP error responses.
- **Graceful Fallbacks**: Safe transaction runner (`runTransaction`) compatible with both MongoDB replica sets and standalone instances.
- **Email Simulation Fallback**: When SMTP credentials are not configured in development, OTPs and notifications are logged directly to the console for frictionless local testing.

---

## 📁 Project Architecture

```
Backend/
├── .env.example              # Environment configuration template
├── .env                      # Local environment configuration
├── .gitignore                # Git ignore patterns
├── package.json              # Dependencies and npm scripts
├── README.md                 # API documentation and project guide
├── scripts/
│   └── seedAdmin.js          # Admin user seeder script
├── config/                   # Database, environment, and mail configuration
├── constants/                # Shared enums and constants
├── controllers/              # Request handlers, grouped by resource
├── middleware/               # Authentication, validation, upload, and errors
├── models/                   # Mongoose models, grouped by resource
├── routes/                   # Resource routes and the API root router
├── services/                 # Reusable business and email services
├── utils/                    # Shared helpers and resource-specific utilities
├── validators/               # Request validation rules, grouped by resource
├── app.js                    # Express app setup and middleware pipeline
├── server.js                 # HTTP server entry point and database connection
├── tests/
│   ├── auth.test.js          # Request validation & authentication tests
│   └── health.test.js        # Health check & 404 tests
└── uploads/
    └── products/             # Uploaded product images
```

Product images currently use local disk storage. This is suitable for local
development, but files on Render's local filesystem do not survive service
restarts or redeploys; configure persistent external storage before relying on
uploaded images in production.

To add a feature, place its route, controller, model, and validator in their
matching resource-specific files under `routes/`, `controllers/`, `models/`, and
`validators/`. Add a service in `services/` only when business logic needs to be
shared or kept separate from request handling.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** running locally or via MongoDB Atlas

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and adjust the variables as needed:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Application server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production` / `test`) | `development` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb://127.0.0.1:27017/ecommerce_db` |
| `JWT_SECRET` | Secret key for JWT signing | (Secure random secret) |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CLIENT_URL` | Allowed CORS origin (e.g. React frontend) | `http://localhost:3000` |
| `ADMIN_NAME` | Super Admin Name for seeder | `Super Admin` |
| `ADMIN_EMAIL` | Super Admin Email for seeder | `admin@example.com` |
| `ADMIN_PASSWORD` | Super Admin Password for seeder | `Admin@12345` |

### 4. Seed the Admin User
Run the automated database seeder to create your initial administrator account:
```bash
npm run seed:admin
```

### 5. Start the Server
- **Development Mode** (with Nodemon):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
- **Run Automated Tests**:
  ```bash
  npm test
  ```

---

## 📡 API Reference (`/api/v1`)

### 🩺 Health Check
- `GET /api/v1/health` - Check API and server status

---

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register customer (`name`, `email`, `password`, `phone`) |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify email OTP (`email`, `otp`) |
| `POST` | `/api/v1/auth/resend-otp` | Public | Resend email OTP (`email`) |
| `POST` | `/api/v1/auth/login` | Public | Customer & Admin login (`email`, `password`) |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request password reset OTP (`email`) |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password with OTP (`email`, `otp`, `newPassword`) |
| `POST` | `/api/v1/auth/change-password` | Private | Change password (`currentPassword`, `newPassword`) |
| `POST` | `/api/v1/auth/logout` | Private | Invalidate session |

---

### 👤 User Profile (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | Private | Get authenticated user profile |
| `PUT` | `/api/v1/users/profile` | Private | Update user profile (`name`, `phone`) |

---

### 📍 Addresses (`/api/v1/addresses`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/addresses` | Private | List all user delivery addresses |
| `GET` | `/api/v1/addresses/:id` | Private | Get address by ID |
| `POST` | `/api/v1/addresses` | Private | Add new address |
| `PUT` | `/api/v1/addresses/:id` | Private | Update existing address |
| `PATCH`| `/api/v1/addresses/:id/default`| Private | Set address as default |
| `DELETE`| `/api/v1/addresses/:id` | Private | Delete address |

---

### 🏷️ Categories (`/api/v1/categories`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Public | Get all active categories |
| `GET` | `/api/v1/categories/:slug` | Public | Get category details by slug or ID |

---

### 📦 Products (`/api/v1/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/products` | Public | Browse/search/filter/sort/paginate products |
| `GET` | `/api/v1/products/featured` | Public | Get featured products list |
| `GET` | `/api/v1/products/:idOrSlug` | Public | Get single product by slug or Mongo ID |

**Product Query Parameters**:
- `search`: Keyword for text search across name, description, SKU
- `category`: Category Mongo ID
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `inStock`: `true` or `false`
- `featured`: `true` or `false`
- `sort`: `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)

---

### 🛒 Shopping Cart (`/api/v1/cart`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cart` | Private | Get cart items, prices, and stock validations |
| `POST` | `/api/v1/cart/items` | Private | Add item to cart (`productId`, `quantity`) |
| `PUT` | `/api/v1/cart/items/:productId` | Private | Update item quantity in cart (`quantity`) |
| `DELETE`| `/api/v1/cart/items/:productId` | Private | Remove item from cart |
| `DELETE`| `/api/v1/cart` | Private | Clear all items from cart |

---

### 🛍️ Orders (`/api/v1/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/orders/checkout-summary` | Private | Calculate prices, taxes, shipping, and stock validation |
| `POST` | `/api/v1/orders` | Private | Place Cash on Delivery order (`addressId`) |
| `GET` | `/api/v1/orders/my-orders` | Private | Customer order history with pagination & status filter |
| `GET` | `/api/v1/orders/:id` | Private | Get single order details |
| `POST` | `/api/v1/orders/:id/cancel` | Private | Cancel order (`reason`) & restore inventory |
| `GET` | `/api/v1/orders/:id/track` | Private | Order tracking timeline and milestones |

---

### 🛡️ Admin Management (`/api/v1/admin`)
*Requires `Authorization: Bearer <token>` and `role: 'admin'`*

#### Dashboard & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Overview revenue, orders count, customers count, low stock items, status distribution |

#### Product Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/products` | Get all products (including inactive) with pagination |
| `POST` | `/api/v1/admin/products` | Create product (multipart/form-data with `images` array) |
| `PUT` | `/api/v1/admin/products/:id` | Update product details & append images |
| `PATCH`| `/api/v1/admin/products/:id/stock` | Update stock quantity directly (`stock`) |
| `DELETE`| `/api/v1/admin/products/:id` | Delete product |

#### Category Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/categories` | Get all categories |
| `POST` | `/api/v1/admin/categories` | Create category (`name`, `description`, `image`, `isActive`) |
| `PUT` | `/api/v1/admin/categories/:id` | Update category details |
| `DELETE`| `/api/v1/admin/categories/:id` | Delete category (checks for associated products) |

#### Customer Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/customers` | Search and paginate registered customers |
| `GET` | `/api/v1/admin/customers/:id` | Customer details and order count |
| `PATCH`| `/api/v1/admin/customers/:id/status`| Activate or deactivate customer account (`isActive`: boolean) |
| `GET` | `/api/v1/admin/customers/:id/orders` | View customer order history |

#### Order Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/orders` | Filter, search, and paginate store orders |
| `PATCH`| `/api/v1/admin/orders/:id/status` | Update order status (`status`, `reason`) |
| `PATCH`| `/api/v1/admin/orders/:id/payment-status` | Update payment status (`paymentStatus`) |

---

## 📦 Order Lifecycle & Statuses

### Order Statuses
1. `PENDING` - Order placed via Cash on Delivery, awaiting merchant confirmation.
2. `CONFIRMED` - Order confirmed by merchant.
3. `PROCESSING` - Order being packed and prepared for dispatch.
4. `SHIPPED` - Dispatched with courier.
5. `OUT_FOR_DELIVERY` - Order is out with delivery agent.
6. `DELIVERED` - Successfully delivered to customer. COD payment marked as `PAID`.
7. `CANCELLED` - Order cancelled (by customer or merchant). Stock restored to inventory.

### Payment Statuses
- `PENDING` (Default for COD upon placement)
- `PAID` (Updated upon delivery or admin confirmation)
- `FAILED`
- `REFUNDED`

---

## 🧪 Testing

Run the test suite using Jest:
```bash
npm test
```
The suite verifies:
- API health check (`/api/v1/health`)
- 404 handler for nonexistent endpoints
- Registration validation schemas (missing fields, password length, format)
- Login validation schemas
- OTP verification validation rules
