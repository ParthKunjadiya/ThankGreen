const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', isAuth, productController.getProducts);

router.get('/product/:productId', isAuth, productController.getProductByProductId);

router.get('/products/category/:categoryId', isAuth, productController.getProductsByCategoryId);

router.get('/products/subCategory/:subCategoryId', isAuth, productController.getProductsBySubCategoryId);

router.get('/products/past-order', isAuth, productController.getProductsByPastOrder);

router.get('/category', isAuth, productController.getCategory);

router.get('/sub-category/:categoryId', isAuth, productController.getSubCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

router.post('/favoriteProducts/:productId', isAuth, productController.postFavoriteProduct);

router.delete('/favoriteProducts/:productId', isAuth, productController.deleteFavoriteProduct);

router.get('/search', isAuth, productController.search);

router.get('/filter', isAuth, productController.filter);

module.exports = router;