const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', isAuth, productController.getProducts);

router.get('/category', isAuth, productController.getCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

module.exports = router;