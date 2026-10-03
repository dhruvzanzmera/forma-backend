const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const app = express();

// Trust reverse proxy headers (Render, Vercel, Heroku, AWS ELB, etc.)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = [
  'https://forma-frontend-six.vercel.app',
  config.clientUrl,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.replace(/\/+$/, '');
      return normalizedAllowed === normalizedOrigin;
    }) || normalizedOrigin.endsWith('.vercel.app'); // Allow Vercel preview/production deployments

    if (isAllowed || config.env === 'development') {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} is not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// HTTP Request Logger
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded product images
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// General API Rate Limiting
app.use('/api/v1', apiLimiter);

// API Version 1 Routes
app.use('/api/v1', routes);

// 404 Catch-all Handler
app.use(notFound);

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
