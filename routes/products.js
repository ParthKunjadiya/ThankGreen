const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', isAuth, productController.getProducts);

router.get('/product/:productId', isAuth, productController.getProduct);

router.get('/category', isAuth, productController.getCategory);

router.get('/sub-category/:categoryId', isAuth, productController.getSubCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

router.post('/favoriteProducts/:productId', isAuth, productController.postFavoriteProduct);

router.delete('/favoriteProducts/:productId', isAuth, productController.deleteFavoriteProduct);

module.exports = router;