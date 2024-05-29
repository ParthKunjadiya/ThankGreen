const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/isAuth');
const { skipAuth } = require('../middleware/skipAuth');

const router = express.Router();

router.get('/product/:productId', skipAuth, productController.getProductByProductId);

router.get('/products/category/:categoryId', skipAuth, productController.getProductsByCategoryId);

router.get('/products/subCategory/:subCategoryId', skipAuth, productController.getProductsBySubCategoryId);

router.get('/category', productController.getCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

router.post('/favoriteProducts/:productId', isAuth, productController.postFavoriteProduct);

router.delete('/favoriteProducts/:productId', isAuth, productController.deleteFavoriteProduct);

router.get('/search', skipAuth, productController.search);

router.get('/show-filter', productController.showFilter);

router.get('/filter', skipAuth, productController.filter);

module.exports = router;