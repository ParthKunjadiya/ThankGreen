const express = require('express');

const productController = require('../controllers/products');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/products', productController.getProducts);

router.get('/product/:productId', productController.getProductByProductId);

router.get('/products/:subCategoryId', productController.getProductBySubCategoryId);

router.get('/category', productController.getCategory);

router.get('/sub-category/:categoryId', productController.getSubCategory);

router.get('/favoriteProducts', isAuth, productController.getFavoriteProducts);

router.post('/favoriteProducts/:productId', isAuth, productController.postFavoriteProduct);

router.delete('/favoriteProducts/:productId', isAuth, productController.deleteFavoriteProduct);

router.get('/filter', productController.filter);

router.get('/products/filter/time', productController.filterByDeliveryTime);

router.get('/products/sort/price/:order', productController.sortByPriceOrder);

module.exports = router;