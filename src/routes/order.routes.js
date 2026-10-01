const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  orderIdParamValidator,
  placeOrderValidator,
  cancelOrderValidator
} = require('../validators/order.validator');

router.use(protect);

router.get('/checkout-summary', orderController.getCheckoutSummary);
router.post('/', validate(placeOrderValidator), orderController.placeOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', validate(orderIdParamValidator), orderController.getOrderById);
router.post('/:id/cancel', validate(cancelOrderValidator), orderController.cancelOrder);
router.get('/:id/track', validate(orderIdParamValidator), orderController.trackOrder);

module.exports = router;
