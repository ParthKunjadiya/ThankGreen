const {
    getProducts,
    getProduct,
    getCategories,
    getSubCategory,
    getFavoriteProducts,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct
} = require('../repository/products');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getProducts = async (req, res, next) => {
    try {
        const [products] = await getProducts({ userId: req.userId })
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
                data: products.map(product => ({
                    product_id: product.product_id,
                    category_name: product.category_name,
                    subcategory_name: product.subcategory_name,
                    product_title: product.product_title,
                    images: product.images ? product.images[0] : null,
                    product_description: product.product_description,
                    product_available_delivery_time: product.product_available_delivery_time,
                    is_favorite: product.is_favorite
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.getProduct = async (req, res, next) => {
    const productId = req.params.productId;
    try {
        const [product] = await getProduct(productId)
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
                data: product.map(product => ({
                    product_id: product.product_id,
                    category_name: product.category_name,
                    subcategory_name: product.subcategory_name,
                    product_title: product.product_title,
                    images: product.images,
                    productQuantity: product.quantity_variants,
                    product_description: product.product_description,
                    product_available_delivery_time: product.product_available_delivery_time,
                    is_favorite: product.is_favorite
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.getCategory = async (req, res, next) => {
    try {
        const [categories] = await getCategories()
        if (!categories) {
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
                data: categories.map(category => ({
                    id: category.id,
                    name: category.name,
                    image: category.image
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.getSubCategory = async (req, res, next) => {
    const categoryId = req.params.categoryId;
    try {
        const [subCategory] = await getSubCategory(categoryId)
        if (!subCategory) {
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
                data: subCategory.map(subCategory => ({
                    id: subCategory.id,
                    category_name: subCategory.category_name,
                    name: subCategory.name,
                    image: subCategory.image
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.getFavoriteProducts = async (req, res, next) => {
    try {
        const [favoriteProducts] = await getFavoriteProducts({ userId: req.userId })
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
                data: favoriteProducts.map(favoriteProduct => ({
                    product_id: favoriteProduct.product_id,
                    category_name: favoriteProduct.category_name,
                    subcategory_name: favoriteProduct.subcategory_name,
                    product_title: favoriteProduct.product_title,
                    images: favoriteProduct.images ? favoriteProduct.images[0] : null,
                    product_description: favoriteProduct.product_description,
                    product_available_delivery_time: favoriteProduct.product_available_delivery_time
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: 'Internal server error',
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
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
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
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}