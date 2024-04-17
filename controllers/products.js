const {
    getProducts,
    getProductByProductId,
    getProductByCategoryId,
    getProductBySubCategoryId,
    getCategoryList,
    getSubCategoryList,
    getFavoriteProducts,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct,
    searchCategoryList,
    searchSubCategoryList,
    searchProductList,
    filter
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const offset = (page - 1) * limit;
        const [products] = await getProducts({ userId: req.userId, offset, limit })
        if (!products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: products
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

exports.getProductByProductId = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const [product] = await getProductByProductId({ userId: req.userId, productId })
        if (!product.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: product
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
        const limit = 2;
        const offset = (page - 1) * limit;
        const [products] = await getProductByCategoryId({ userId: req.userId, categoryId, offset, limit })
        if (!products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: products
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
        const limit = 2;
        const offset = (page - 1) * limit;
        const [products] = await getProductBySubCategoryId({ userId: req.userId, subCategoryId, offset, limit })
        if (!products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: products
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
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const offset = (page - 1) * limit;
        const [categoryList] = await getCategoryList(offset, limit)
        if (!categoryList.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Category found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'category fetched!',
                data: categoryList
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

exports.getSubCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const offset = (page - 1) * limit;
        const [subCategoryList] = await getSubCategoryList(categoryId, offset, limit)
        if (!subCategoryList) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Sub Category found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'sub-category fetched!',
                data: subCategoryList
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
        const limit = 2;
        const offset = (page - 1) * limit;
        const [favoriteProducts] = await getFavoriteProducts({ userId: req.userId, offset, limit })
        if (!favoriteProducts.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Products found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Favorite Products fetched!',
                data: favoriteProducts
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
        await postFavoriteProduct({ userId: req.userId, productId })
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
        const searchText = req.body.searchText;
        const [searchCategories] = await searchCategoryList(searchText)
        const [searchSubCategories] = await searchSubCategoryList(searchText)
        const [searchProducts] = await searchProductList({ userId: req.userId, searchText })
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: {
                    searchCategoryList: searchCategories,
                    searchSubCategoryList: searchSubCategories,
                    searchProductList: searchProducts
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
        const [categoryList] = await getCategoryList();
        const categoryFilter = categoryList.map(category => {
            const { image, ...rest } = category;
            return rest;
        });

        let minPrice = 0;
        let maxPrice = 100000;
        const priceFilter = { minPrice, maxPrice };
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'filter option showed successfully',
                data: {
                    "categoryFilter": categoryFilter,
                    "priceFilter": priceFilter
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
    const searchText = req.body.searchText;
    const categoryFilter = req.body.categoryFilter;
    const priceFilter = req.body.priceFilter;
    const deliveryTimeFilter = req.body.deliveryTimeFilter;
    const priceOrderFilter = req.body.priceOrderFilter;
    try {
        const [products] = await filter({ userId: req.userId, searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter });
        if (!products || !products.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'No Product found for given category and price filter',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: products
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