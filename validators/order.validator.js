const { body, param } = require('express-validator');
const { OrderStatus, PaymentStatus, PaymentMethod } = require('../constants');

const orderIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Order ID format')
];

const placeOrderValidator = [
  body('addressId')
    .notEmpty()
    .withMessage('Shipping address ID is required')
    .isMongoId()
    .withMessage('Invalid Address ID format'),
  body('paymentMethod')
    .optional()
    .isIn([PaymentMethod.COD])
    .withMessage('Only Cash On Delivery (COD) is supported at this time')
];

const cancelOrderValidator = [
  ...orderIdParamValidator,
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Cancellation reason cannot exceed 300 characters')
];

const updateOrderStatusValidator = [
  ...orderIdParamValidator,
  body('status')
    .notEmpty()
    .withMessage('Order status is required')
    .isIn(Object.values(OrderStatus))
    .withMessage(`Invalid status. Allowed statuses: ${Object.values(OrderStatus).join(', ')}`)
];

const updatePaymentStatusValidator = [
  ...orderIdParamValidator,
  body('paymentStatus')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(Object.values(PaymentStatus))
    .withMessage(`Invalid payment status. Allowed: ${Object.values(PaymentStatus).join(', ')}`)
];

module.exports = {
  orderIdParamValidator,
  placeOrderValidator,
  cancelOrderValidator,
  updateOrderStatusValidator,
  updatePaymentStatusValidator
};
