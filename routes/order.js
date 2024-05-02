const express = require('express');

const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/orders', isAuth, orderController.getOrders);

router.get('/orders/:orderId', isAuth, orderController.getOrderByOrderId);

router.post('/orders', isAuth, orderController.postOrder);

router.post('/stripe/webhook', orderController.stripeWebhook);

router.post('/rate-order', isAuth, orderController.rateOrder);

router.get('/track-order/:orderId', isAuth, orderController.trackOrder);

router.post('/cancel-order', isAuth, orderController.cancelOrder);

module.exports = router;