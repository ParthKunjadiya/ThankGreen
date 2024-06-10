const {
    getProductByProductId,
    getProductByCategoryId,
    getProductCountByCategoryId,
    getProductBySubCategoryId,
    getProductCountBySubCategoryId,
    getCategoryList,
    getFavoriteProducts,
    getFavoriteProductsCount,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct,
    searchCategoryList,
    searchSubCategoryList,
    searchProductList,
    searchProductCount,
    filterProducts,
    filterProductsCount,
    getDeliveryTimeFilter,
    getMaxPrice
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getProductByProductId = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const [product] = await getProductByProductId({ userId: req.userId, productId })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Product Detail fetched!',
                data: {
                    product: product.length ? product : `Product Detail not found.`
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductsByCategoryId = async (req, res, next) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [products] = await getProductByCategoryId({ userId: req.userId, categoryId, offset, limit })
        const [productsCount] = await getProductCountByCategoryId({ categoryId })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    products: products.length ? products : `No Products found`,
                    total_products: productsCount.length,
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getProductsBySubCategoryId = async (req, res, next) => {
    try {
        const subCategoryId = req.params.subCategoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [products] = await getProductBySubCategoryId({ userId: req.userId, subCategoryId, offset, limit })
        const [productsCount] = await getProductCountBySubCategoryId({ subCategoryId })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    products: products.length ? products : `No Products found`,
                    total_products: productsCount.length,
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getCategory = async (req, res, next) => {
    try {
        const [categoryList] = await getCategoryList()
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'category fetched!',
                data: {
                    categoryList: categoryList.length ? categoryList : `No category found`
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.getFavoriteProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [favoriteProducts] = await getFavoriteProducts({ userId: req.userId, offset, limit })
        const [favoriteProductsCount] = await getFavoriteProductsCount({ userId: req.userId })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Favorite Products fetched!',
                data: {
                    favoriteProducts: favoriteProducts.length ? favoriteProducts : [],
                    total_products: favoriteProductsCount.length,
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: 'Internal server error'
            })
        );
    }
}

exports.postFavoriteProduct = async (req, res, next) => {
    const productId = req.params.productId;
    try {
        const [favoriteProduct] = await getFavoriteProduct({ userId: req.userId, productId })
        if (favoriteProduct.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Product already in favorite list',
                })
            );
        }
        await postFavoriteProduct({ user_id: req.userId, product_id: productId })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Product added in your favorite list.',
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.deleteFavoriteProduct = async (req, res, next) => {
    const productId = req.params.productId;
    try {
        const [favoriteProduct] = await getFavoriteProduct({ userId: req.userId, productId })
        if (!favoriteProduct.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Product already removed from favorite list',
                })
            );
        }
        await deleteFavoriteProduct({ userId: req.userId, productId })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Product removed from your favorite list.',
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.search = async (req, res, next) => {
    try {
        const { searchText } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [searchCategories] = await searchCategoryList(searchText)
        const [searchSubCategories] = await searchSubCategoryList(searchText)
        const [searchProducts] = await searchProductList({ userId: req.userId, searchText, offset, limit })
        const [searchProductsCount] = await searchProductCount({ searchText })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: {
                    searchCategoryList: searchCategories.length ? searchCategories : `No category found`,
                    searchSubCategoryList: searchSubCategories.length ? searchSubCategories : `No subcategory found`,
                    searchProductList: searchProducts.length ? searchProducts : `No products found`,
                    total_search_products: searchProductsCount.length,
                }
            })
        )
    }
    catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'error',
                statusCode: 500,
                msg: 'internal server error'
            })
        )
    }
}

exports.showFilter = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const [categoryList] = await getCategoryList(offset, limit);
        const categoryFilter = categoryList.map(category => {
            const { subcategories, ...rest } = category;
            return rest;
        });

        const [price] = await getMaxPrice();
        const priceFilter = { minPrice: 0, maxPrice: price[0].max_price };

        const [deliveryTimeFilter] = await getDeliveryTimeFilter()
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'filter option showed successfully',
                data: {
                    categoryFilter,
                    priceFilter,
                    deliveryTimeFilter
                }
            })
        )
    }
    catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'error',
                statusCode: 500,
                msg: 'internal server error'
            })
        )
    }
}

exports.filter = async (req, res, next) => {
    let { searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter } = req.query;
    let parsedCategoryFilter, parsedPriceFilter, parsedDeliveryTimeFilter;
    try {
        parsedCategoryFilter = categoryFilter ? JSON.parse(categoryFilter) : undefined;
        parsedPriceFilter = priceFilter ? JSON.parse(priceFilter) : undefined;
        parsedDeliveryTimeFilter = deliveryTimeFilter ? JSON.parse(deliveryTimeFilter) : undefined;
    } catch (error) {
        console.error('Error parsing filters: ', error);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        if (!priceOrderFilter) {
            priceOrderFilter = "ASC";
        }

        const [products] = await filterProducts({ userId: req.userId, searchText, parsedCategoryFilter, parsedPriceFilter, parsedDeliveryTimeFilter, priceOrderFilter, offset, limit });
        const [productsCount] = await filterProductsCount({ searchText, parsedCategoryFilter, parsedPriceFilter, parsedDeliveryTimeFilter, priceOrderFilter });

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    filterProducts: products.length ? products : `No products found`,
                    total_filter_products: productsCount.length,
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}