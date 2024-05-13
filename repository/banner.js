const db = require('../util/database');

const getBanner = async () => {
    let sql = `SELECT
            b.url AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b`

    return await db.query(sql)
}

const getBannerDetail = async (bannerId) => {
    let sql = `SELECT * FROM bannerDescription WHERE banner_id = ?`

    let params = [bannerId]
    return await db.query(sql, params)
}

const getBannerProductByProductId = async ({ userId, productId, bannerDiscount }) => {
    let params = [];
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            (
                SELECT JSON_ARRAYAGG(i.image)
                FROM images i
                WHERE i.product_id = p.id
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'quantity_variant', pq.quantity_variant,
                        'actual_price', pq.actual_price,
                        'selling_price', pq.selling_price
                    )
                )
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            (
                SELECT CONCAT(MAX(FORMAT(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100, 0)), '%')
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS discount,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time`
    if (userId) {
        sql += `, CASE
                WHEN f.product_id IS NOT NULL THEN true
                ELSE false
            END AS is_favorite`
    }
    sql += ` FROM
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id
        JOIN
            category c ON s.category_id = c.id`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE p.id = ?`
    params.push(productId)
    if (bannerDiscount) {
        sql += ` AND (SELECT MAX(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100)
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id) <= ?`;
        params.push(bannerDiscount);
    }

    return await db.query(sql, params)
}

const getBannerProductByCategoryId = async ({ userId, categoryId, bannerDiscount, offset, limit }) => {
    let params = [];
    let sql = `SELECT
            p.id AS product_id,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'quantity_variant', pq.quantity_variant,
                        'actual_price', pq.actual_price,
                        'selling_price', pq.selling_price
                    )
                )
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            (
                SELECT CONCAT(MAX(FORMAT(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100, 0)), '%')
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS discount,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time`
    if (userId) {
        sql += `, CASE
                WHEN f.product_id IS NOT NULL THEN true
                ELSE false
            END AS is_favorite`
    }
    sql += ` FROM
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE s.category_id = ?`
    params.push(categoryId)
    if (bannerDiscount) {
        sql += ` AND (SELECT MAX(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100)
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id) <= ?`;
        params.push(bannerDiscount);
    }
    sql += `  ORDER BY
        (SELECT MAX(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100)
        FROM productQuantity pq
        WHERE pq.product_id = p.id) DESC
    LIMIT ?, ?`

    params.push(offset, limit)
    return await db.query(sql, params);
}

const getBannerProductBySubCategoryId = async ({ userId, subCategoryId, bannerDiscount, offset, limit }) => {
    let params = [];
    let sql = `SELECT
            p.id AS product_id,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'quantity_variant', pq.quantity_variant,
                        'actual_price', pq.actual_price,
                        'selling_price', pq.selling_price
                    )
                )
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            (
                SELECT CONCAT(MAX(FORMAT(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100, 0)), '%')
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS discount,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time`
    if (userId) {
        sql += `, CASE
                WHEN f.product_id IS NOT NULL THEN true
                ELSE false
            END AS is_favorite`
    }
    sql += ` FROM products p`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE p.subcat_id = ?`
    params.push(subCategoryId)
    if (bannerDiscount) {
        sql += ` AND (SELECT MAX(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100)
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id) <= ?`;
        params.push(bannerDiscount);
    }
    sql += `  ORDER BY
        (SELECT MAX(((pq.actual_price - pq.selling_price) / pq.actual_price) * 100)
        FROM productQuantity pq
        WHERE pq.product_id = p.id) DESC
    LIMIT ?, ?`

    params.push(offset, limit)
    return await db.query(sql, params);
}

module.exports = {
    getBanner,
    getBannerDetail,
    getBannerProductByCategoryId,
    getBannerProductBySubCategoryId,
    getBannerProductByProductId
};