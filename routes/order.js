const express = require('express');

const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/orders', isAuth, orderController.getOrders);

router.get('/orders/:orderId', isAuth, orderController.getOrderByOrderId);

router.post('/orders', isAuth, orderController.postOrder);

router.post('/webhook', orderController.webhook);

router.post('/rate-order', isAuth, orderController.rateOrder);

module.exports = router;