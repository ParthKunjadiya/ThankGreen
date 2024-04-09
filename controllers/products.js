const {
    getProducts,
    getCategories,
    getFavoriteProducts
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
                msg: "Internal server error",
            })
        );
    }
}