const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const currentEnv = process.env.NODE_ENV || 'development';

// 1. Load environment-specific file (.env.production or .env.development) if present
const specificEnvPath = path.resolve(rootDir, `.env.${currentEnv}`);
if (fs.existsSync(specificEnvPath)) {
  dotenv.config({ path: specificEnvPath });
}

// 2. Load root .env as fallback / default (will not overwrite already set variables)
const defaultEnvPath = path.resolve(rootDir, '.env');
if (fs.existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_ecommerce_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  
  admin: {
    name: process.env.ADMIN_NAME || 'Super Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    phone: process.env.ADMIN_PHONE || '9876543210'
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || '"E-Commerce Store" <no-reply@ecommerce.com>'
  },
  
  business: {
    otpExpireMinutes: parseInt(process.env.OTP_EXPIRE_MINUTES || '10', 10),
    otpResendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    taxRatePercentage: parseFloat(process.env.TAX_RATE_PERCENTAGE || '5'),
    shippingFee: parseFloat(process.env.SHIPPING_FEE || '50'),
    freeShippingThreshold: parseFloat(process.env.FREE_SHIPPING_THRESHOLD || '1000')
  }
};

module.exports = config;
