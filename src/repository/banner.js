const db = require('../util/database');

const getBanner = async () => {
    let sql = `SELECT
            b.id AS banner_id,
            b.title,
            b.banner_type,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b`

    return await db.query(sql)
}

const getBannerByBannerIds = async (bannerIds) => {
    let sql = `SELECT
            b.id AS banner_id,
            b.title,
            b.banner_type,
            b.image AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b
        WHERE b.id IN (?)`
    let params = [bannerIds]
    return await db.query(sql, params)
}

const getBannerDetail = async (bannerId) => {
    let sql = `SELECT * FROM bannerDescription WHERE banner_id = ?`

    let params = [bannerId]
    return await db.query(sql, params)
}

const getBannerProductsByProductIds = async ({ userId, productId, offset, limit }) => {
    let params = [];
    let sql = `SELECT DISTINCT
            p.id AS product_id,
            p.title AS product_title,
            (
                SELECT JSON_ARRAYAGG(i.image)
                FROM images i
                WHERE i.product_id = p.id
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'quantity_variant_id', pq.id,
                        'quantity_variant', pq.quantity_variant,
                        'actual_price', pq.actual_price,
                        'selling_price', pq.selling_price
                    )
                )
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time`
    if (userId) {
        sql += `, CASE
                WHEN f.product_id IS NOT NULL THEN true
                ELSE false
            END AS is_favorite`
    }
    sql += ` FROM
            products p`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE p.id IN (?)
        LIMIT ?, ?`
    params.push(productId, offset, limit)

    return await db.query(sql, params)
}

const getBannerProductsCountByProductIds = async ({ productId }) => {
    let params = [];
    let sql = `SELECT DISTINCT id FROM products WHERE id IN (?)`

    params.push(productId)
    return await db.query(sql, params)
}

module.exports = {
    getBanner,
    getBannerByBannerIds,
    getBannerDetail,
    getBannerProductsByProductIds,
    getBannerProductsCountByProductIds
};