const express = require('express');

const homeController = require('../controllers/home');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/', isAuth, homeController.home);

router.get('/banner/:bannerId', isAuth, homeController.getBannerProducts);

module.exports = router;