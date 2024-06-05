const {
    getCategoryList,
    getProductsByPastOrder,
    getProductsByProductIds,
} = require('../repository/products');

const {
    getReferralDetails,
    getTotalInvite
} = require('../repository/referral');

const {
    getBanner,
    getBannerByBannerIds,
    getBannerDetail,
    getBannerProductsByProductIds,
    getBannerProductsCountByProductIds
} = require('../repository/banner');

const { generateResponse, sendHttpResponse } = require("../helper/response");
const { getAllCoupons } = require('../repository/coupons');

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

        const [banners] = await getBanner();
        const groupedBanners = banners.reduce((acc, banner) => {
            const { vertical_priority, title, banner_type } = banner;

            // Only process banners that are not of type "products"
            if (banner_type !== 'Products') {
                if (!acc[vertical_priority]) {
                    acc[vertical_priority] = { title: title || "", banner_type, vertical_priority, banners: [] };
                }
                acc[vertical_priority].banners.push(banner);
            }

            return acc;
        }, {});

        // Sort each group by horizontal_priority and transform into desired format
        const groupedBannerDetails = Object.values(groupedBanners).map(group => {
            group.banners = group.banners.sort((a, b) => a.horizontal_priority - b.horizontal_priority).map(banner => ({
                id: banner.banner_id,
                image: banner.banner_image
            }));
            return group;
        });

        const [coupons] = await getAllCoupons()

        const [categoryList] = await getCategoryList(categoryOffset, categoryLimit)
        const categoryFilter = categoryList.map(category => {
            const { subcategories, ...rest } = category;
            return rest;
        });

        let pastOrders;
        if (req.userId) {
            [pastOrders] = await getProductsByPastOrder({ userId: req.userId, pastOrdersOffset, pastOrdersLimit })
        }

        let productIds = [1, 2, 4, 7, 10]
        // const [recommendedProducts] = await getRecommendedProducts({ userId: req.userId, recommendedProductsOffset, recommendedProductsLimit })
        const [recommendedProducts] = await getProductsByProductIds({ userId: req.userId, productIds, recommendedProductsOffset, recommendedProductsLimit })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Products fetched!',
                data: {
                    banner: groupedBannerDetails,
                    coupons,
                    categoryFilter,
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
        const [banner] = await getBannerByBannerIds(bannerId)
        if (!banner.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid BannerId!'
                })
            );
        }
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [bannerDetail] = await getBannerDetail(bannerId)
        const { product_id } = bannerDetail[0];
        let bannerProducts, bannerProductsCount
        if (product_id !== null) {
            let parsedProductIds = JSON.parse(product_id);
            [bannerProducts] = await getBannerProductsByProductIds({ userId: req.userId, productId: parsedProductIds, offset, limit });
            [bannerProductsCount] = await getBannerProductsCountByProductIds({ productId: parsedProductIds });
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Banner Products fetched!',
                data: {
                    products: bannerProducts && bannerProducts.length ? bannerProducts : `No products found`,
                    total_products: bannerProductsCount ? bannerProductsCount.length : 0
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

exports.getReferralDetails = async (req, res, next) => {
    try {
        const [referral] = await getReferralDetails({ userId: req.userId });
        const { code, successful_invite, remaining_reward } = referral[0];

        let [total_invite] = await getTotalInvite(code);
        let totalReward = successful_invite * 2;

        let referralDetails = {
            referral_code: code,
            total_invite: total_invite[0].count,
            successful_invite,
            remaining_reward,
            totalReward
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Referral Details',
                data: {
                    referralDetails
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