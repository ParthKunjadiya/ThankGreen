const express = require('express');

const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/isAuth');
const { skipAuth } = require('../middleware/skipAuth');

const router = express.Router();

router.get('/orders', isAuth, orderController.getOrders);

router.get('/orders/:orderId', isAuth, orderController.getOrderByOrderId);

router.get('/order-summary', skipAuth, orderController.getOrderSummary);

router.post('/checkout', isAuth, orderController.postOrder);

router.post('/stripe/webhook', orderController.stripeWebhook);

router.post('/rate-order', isAuth, orderController.rateOrder);

router.get('/track-order/:orderId', isAuth, orderController.trackOrder);

router.post('/cancel-order', isAuth, orderController.cancelOrder);

router.post('/report-issue', isAuth, orderController.reportIssue);

module.exports = router;