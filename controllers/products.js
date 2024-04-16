const {
    getProducts,
    getProductByProductId,
    getProductBySubCategoryId,
    getCategoryList,
    getSubCategoryList,
    getFavoriteProducts,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct,
    search,
    filter
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getProducts = async (req, res, next) => {
    try {
        const [products] = await getProducts()
        if (!products) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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
    const productId = req.params.productId;
    try {
        const [product] = await getProductByProductId(productId)
        if (!product) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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

exports.getProductBySubCategoryId = async (req, res, next) => {
    const subCategoryId = req.params.subCategoryId;
    try {
        const [products] = await getProductBySubCategoryId(subCategoryId)
        if (!products) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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
        const [categoryList] = await getCategoryList()
        if (!categoryList) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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
    const categoryId = req.params.categoryId;
    try {
        const [subCategoryList] = await getSubCategoryList(categoryId)
        if (!subCategoryList) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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
        const [favoriteProducts] = await getFavoriteProducts({ userId: req.userId })
        console.log(favoriteProducts)
        if (!favoriteProducts) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
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
        const [result] = await postFavoriteProduct({ userId: req.userId, productId })
        if (!result) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error',
                })
            );
        }
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
        const [result] = await deleteFavoriteProduct({ userId: req.userId, productId })
        if (!result) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal Server Error',
                })
            );
        }
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
    const searchText = req.body.searchText;
    try {
        const [searchProducts] = await search(searchText)
        if (!searchProducts || !searchProducts.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Products for this search not found',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: 'success',
                statusCode: 200,
                msg: 'searching products successfully',
                data: searchProducts
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
        const [products] = await filter(searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter);
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