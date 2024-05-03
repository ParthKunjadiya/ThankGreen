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
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [banner] = await getBanner();
        const [categoryList] = await getCategoryList(offset, limit)
        const [pastOrders] = await getProductsByPastOrder({ userId: req.userId, offset, limit })
        // const [recommendedProducts] = await getRecommendedProducts(offset, limit)

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