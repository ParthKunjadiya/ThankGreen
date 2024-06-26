const express = require('express');

const couponController = require('../controllers/coupons');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/', couponController.getCoupons);

router.get('/t&c/:couponId', couponController.getTermsByCouponId);

router.get('/apply', isAuth, couponController.applyCoupon);

module.exports = router;