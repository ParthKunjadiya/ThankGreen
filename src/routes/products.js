const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/isAuth');

const router = express.Router();

router.get('/products', isAuth, productController.getProducts);

router.get('/product/:productId', isAuth, productController.getProductByProductId);

router.get('/products/category/:categoryId', isAuth, productController.getProductsByCategoryId);

router.get('/products/subCategory/:subCategoryId', isAuth, productController.getProductsBySubCategoryId);

router.get('/category', isAuth, productController.getCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

router.post('/favoriteProducts/:productId', isAuth, productController.postFavoriteProduct);

router.delete('/favoriteProducts/:productId', isAuth, productController.deleteFavoriteProduct);

router.get('/search', isAuth, productController.search);

router.get('/show-filter', isAuth, productController.showFilter);

router.get('/filter', isAuth, productController.filter);

module.exports = router;