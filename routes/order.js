const express = require('express');

const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/current-orders', isAuth, orderController.getCurrentOrders);

router.get('/past-orders', isAuth, orderController.getPastOrders);

router.get('/orders/:orderId', isAuth, orderController.getOrderByOrderId);

router.post('/orders', isAuth, orderController.postOrder);

router.post('/rate-order', isAuth, orderController.rateOrder);

module.exports = router;