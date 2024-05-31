const express = require('express');

const homeController = require('../controllers/home');
const { isAuth } = require('../middleware/isAuth');
const { skipAuth } = require('../middleware/skipAuth');

const router = express.Router();

router.get('/', skipAuth, homeController.home);

router.get('/banner/:bannerId', skipAuth, homeController.getBannerProducts);

router.get('/referral', isAuth, homeController.getReferralDetails);

module.exports = router;