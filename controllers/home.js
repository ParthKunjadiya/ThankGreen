const {
    getCategoryList,
    getProductsByPastOrder,
    getRecommendedProducts,
} = require('../repository/products');

const {
    getBanner,
    getBannerDetail,
    getBannerProductByCategoryId,
    getBannerProductBySubCategoryId,
    getBannerProductByProductId
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

exports.getBannerProducts = async (req, res, next) => {
    try {
        const bannerId = req.params.bannerId;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        let bannerDiscount;
        const [bannerDetail] = await getBannerDetail(bannerId)
        if (bannerDetail[0].key === 'discount') {
            bannerDiscount = bannerDetail[0].value
        }

        let category_id, subcategory_id, product_id, products
        if (bannerDetail[0].category_id !== null) {
            category_id = bannerDetail[0].category_id;
            [products] = await getBannerProductByCategoryId({ userId: req.userId, categoryId: category_id, bannerDiscount, offset, limit })
            if (!products.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "success",
                        statusCode: 200,
                        msg: 'No Products found.',
                    })
                );
            }
        } else if (bannerDetail[0].subcategory_id !== null) {
            subcategory_id = bannerDetail[0].subcategory_id;
            [products] = await getBannerProductBySubCategoryId({ userId: req.userId, subCategoryId: subcategory_id, bannerDiscount, offset, limit })
            if (!products.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "success",
                        statusCode: 200,
                        msg: 'No Products found.',
                    })
                );
            }
        } else if (bannerDetail[0].product_id !== null) {
            product_id = bannerDetail[0].product_id;
            [products] = await getBannerProductByProductId({ userId: req.userId, productId: product_id })
            if (!products.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "success",
                        statusCode: 200,
                        msg: 'Product Detail not found.',
                    })
                );
            }
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Banner Products fetched!',
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