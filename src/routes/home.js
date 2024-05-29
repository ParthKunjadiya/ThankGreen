const express = require('express');

const homeController = require('../controllers/home');
const { skipAuth } = require('../middleware/skipAuth');

const router = express.Router();

router.get('/', skipAuth, homeController.home);

router.get('/banner/:bannerId', skipAuth, homeController.getBannerProducts);

module.exports = router;