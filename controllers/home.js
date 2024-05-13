const {
    getCategoryList,
    getProductsByPastOrder,
    getRecommendedProducts
} = require('../repository/products');

const {
    getBanner
} = require('../repository/banner');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.home = async (req, res, next) => {
    try {
        const categoryPage = parseInt(req.query.categoryPage) || 1;
        const categoryLimit = 10;
        const categoryOffset = (categoryPage - 1) * categoryLimit;

        const pastOrdersPage = parseInt(req.query.pastOrdersPage) || 1;
        const pastOrdersLimit = 10;
        const pastOrdersOffset = (pastOrdersPage - 1) * pastOrdersLimit;

        const recommendedProductsPage = parseInt(req.query.recommendedProductsPage) || 1;
        const recommendedProductsLimit = 10;
        const recommendedProductsOffset = (recommendedProductsPage - 1) * recommendedProductsLimit;

        const [banner] = await getBanner();
        const [categoryList] = await getCategoryList(categoryOffset, categoryLimit)
        const [pastOrders] = await getProductsByPastOrder({ userId: req.userId, pastOrdersOffset, pastOrdersLimit })
        const [recommendedProducts] = await getRecommendedProducts({ userId: req.userId, recommendedProductsOffset, recommendedProductsLimit })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    banner,
                    categoryList,
                    pastOrders,
                    recommendedProducts
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