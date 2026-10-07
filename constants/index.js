/**
 * Application Constants and Enums
 */

const UserRole = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer'
});

const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
});

const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
});

const PaymentMethod = Object.freeze({
  COD: 'COD'
});

const OtpType = Object.freeze({
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET'
});

module.exports = {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OtpType
};
