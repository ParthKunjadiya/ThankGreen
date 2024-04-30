const db = require('../util/database');

const getProducts = async ({ userId, offset, limit }) => {
    let params = [];
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
                FROM (
                    SELECT pq.quantity_variant, pq.actual_price, pq.selling_price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.selling_price ASC
                ) AS pq
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
    sql += ` LIMIT ?, ?`

    params.push(offset, limit)
    return await db.query(sql, params)
}

const getProductByProductId = async ({ userId, productId }) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
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
    return await db.query(sql, params)
}

const getProductByCategoryId = async ({ userId, categoryId, offset, limit }) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
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
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE s.category_id = ?
        LIMIT ?, ?`

    params.push(categoryId, offset, limit)
    return await db.query(sql, params);
}

const getProductBySubCategoryId = async ({ userId, subCategoryId, offset, limit }) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
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
    sql += ` FROM products p`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE p.subcat_id = ?
        LIMIT ?, ?`

    params.push(subCategoryId, offset, limit)
    return await db.query(sql, params);
}

const getCategoryList = async (offset, limit) => {
    let sql = `SELECT id, name, image FROM category LIMIT ?, ?`

    let params = [offset, limit]
    return await db.query(sql, params);
}

const getSubCategoryList = async (categoryId, offset, limit) => {
    let sql = `SELECT
            s.id,
            c.name AS category_name,
            s.name AS subCategory_name,
            s.image
        FROM subCategory s
        JOIN category c ON s.category_id = c.id
        WHERE category_id = ?
        LIMIT ?, ?`

    let params = [categoryId, offset, limit]
    return await db.query(sql, params);
}

const getFavoriteProducts = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
                FROM (
                    SELECT pq.quantity_variant, pq.actual_price, pq.selling_price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.selling_price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time
        FROM
            products p
        JOIN
            favorites f ON p.id = f.product_id
        JOIN
            subCategory s ON p.subcat_id = s.id
        JOIN
            category c ON s.category_id = c.id
        WHERE
            f.user_id = ?
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params);
}

const getFavoriteProduct = async ({ productId, userId }) => {
    let sql = `SELECT * FROM favorites WHERE (product_id = ? AND user_id = ?)`

    let params = [productId, userId]
    return await db.query(sql, params);
}

const postFavoriteProduct = async ({ product_id, user_id }) => {
    let sql = `INSERT INTO favorites SET ?`

    let params = { product_id, user_id }
    return await db.query(sql, params);
}

const deleteFavoriteProduct = async ({ productId, userId }) => {
    let sql = `DELETE FROM favorites WHERE (product_id = ? AND user_id = ?)`

    let params = [productId, userId]
    return await db.query(sql, params);
}

const searchCategoryList = async (searchText) => {
    let sql = `SELECT id, name, image FROM category WHERE name LIKE ?`

    const searchParam = `%${searchText}%`;
    let params = [searchParam]
    return await db.query(sql, params);
}

const searchSubCategoryList = async (searchText) => {
    let sql = `SELECT id, name, image FROM subCategory WHERE name LIKE ?`

    const searchParam = `%${searchText}%`;
    let params = [searchParam]
    return await db.query(sql, params);
}

const searchProductList = async ({ userId, searchText }) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
                FROM (
                    SELECT pq.quantity_variant, pq.actual_price, pq.selling_price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.selling_price ASC
                ) AS pq
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
    sql += ` FROM products p`
    if (userId) {
        sql += ` LEFT JOIN
                favorites f ON p.id = f.product_id AND f.user_id = ?`;
        params.push(userId)
    }
    sql += ` WHERE 
            p.title LIKE ?`

    const searchParam = `%${searchText}%`;
    params.push(searchParam)
    return await db.query(sql, params);
}

const filter = async ({ userId, searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter }) => {
    let params = []
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'actual_price', pq.actual_price, 'selling_price', pq.selling_price))
                FROM (
                    SELECT pq.quantity_variant, pq.actual_price, pq.selling_price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.selling_price ASC
                    LIMIT 1
                ) AS pq
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
    sql += ` WHERE
            (
                SELECT MIN(pq.selling_price)
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) BETWEEN ? AND ?`;
    params.push(priceFilter.min, priceFilter.max)

    if (searchText) {
        sql += ` AND (c.name LIKE ?
            OR s.name LIKE ?
            OR p.title LIKE ?)`
        const searchParam = `%${searchText}%`;
        params.push(searchParam, searchParam, searchParam);
    }

    if (categoryFilter.length) {
        sql += ` AND c.id IN (${categoryFilter.map(() => '?').join(',')})`;
        params.push(...categoryFilter);
    }

    if (deliveryTimeFilter.start && deliveryTimeFilter.end) {
        sql += ` AND p.start_delivery_time >= ? AND p.end_delivery_time <= ?`;
        params.push(deliveryTimeFilter.start, deliveryTimeFilter.end);
    }

    if (priceOrderFilter === "ASC" || priceOrderFilter === "DESC") {
        sql += ` ORDER BY (
            SELECT MIN(pq.selling_price)
            FROM productQuantity pq
            WHERE pq.product_id = p.id
        ) ${priceOrderFilter}`;
    }
    return await db.query(sql, params);
}

module.exports = {
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
};