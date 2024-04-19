const express = require('express');

const orderController = require('../controllers/order');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/orders', isAuth, orderController.getOrders);

router.post('/orders', isAuth, orderController.postOrder);

module.exports = router;