const db = require('../util/database');

const getProducts = async () => {
    return await db.query(
        `SELECT
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id
        JOIN
            category c ON s.category_id = c.id
        LEFT JOIN
            favorites f ON p.id = f.product_id`
    );
}

const getProductByProductId = async (productId) => {
    return await db.query(
        `SELECT
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id
        JOIN
            category c ON s.category_id = c.id
        LEFT JOIN
            favorites f ON p.id = f.product_id
        WHERE
            p.id = ?`,
        [productId]
    );
}

const getProductBySubCategoryId = async (subCategoryId) => {
    return await db.query(
        `SELECT
            p.id AS product_id,
            p.title AS product_title,
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM
            products p
        LEFT JOIN
            favorites f ON p.id = f.product_id
        WHERE
            p.subcat_id = ?`,
        [subCategoryId]
    );
}

const getCategoryList = async () => {
    return await db.query('SELECT id, name, image FROM category');
}

const getSubCategoryList = async (categoryId) => {
    return await db.query('SELECT s.id, c.name AS category_name, s.name AS subCategory_name, s.image FROM subCategory s JOIN category c ON s.category_id = c.id WHERE category_id = ?', [categoryId]);
}

const getFavoriteProducts = async ({ userId }) => {
    return await db.query(
        `SELECT
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
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
            f.user_id = ?`,
        [userId]
    );
}

const getFavoriteProduct = async ({ productId, userId }) => {
    return await db.query(`SELECT * FROM favorites WHERE (product_id = ? AND user_id = ?)`, [productId, userId]);
}

const postFavoriteProduct = async ({ productId, userId }) => {
    return await db.query(`INSERT INTO favorites SET ?`, {
        product_id: productId,
        user_id: userId
    });
}

const deleteFavoriteProduct = async ({ productId, userId }) => {
    return await db.query(`DELETE FROM favorites WHERE (product_id = ? AND user_id = ?)`, [productId, userId]);
}

const search = async (searchText) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM 
            products p
        JOIN 
            subCategory s ON p.subcat_id = s.id
        JOIN
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id
        WHERE
            c.name LIKE '%${searchText}%'
            OR s.name LIKE '%${searchText}%'
        UNION

        SELECT 
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM
            products p
        JOIN
            subCategory s ON p.subcat_id = s.id
        JOIN 
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id
        WHERE 
            p.title LIKE '%${searchText}%'
            OR p.description LIKE '%${searchText}%'`
    console.log(sql)
    return await db.query(sql);
}

const filter = async (searchText, categoryFilter, priceFilter, deliveryTimeFilter, priceOrderFilter) => {
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
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM 
            products p
        JOIN 
            subCategory s ON p.subcat_id = s.id
        JOIN 
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id
        WHERE
            (
                SELECT MIN(pq.price)
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) BETWEEN ${priceFilter.min} AND ${priceFilter.max}`;

    if (searchText) {
        sql += ` AND (c.name LIKE '%${searchText}%'
            OR s.name LIKE '%${searchText}%'
            OR p.title LIKE '%${searchText}%'
            OR p.description LIKE '%${searchText}%')`
    }

    if (categoryFilter.length) {
        sql += ` AND c.id IN (${categoryFilter.map((id) => id).join(',')})`;
    }

    if (deliveryTimeFilter.start && deliveryTimeFilter.end) {
        sql += ` AND p.start_delivery_time >= '${deliveryTimeFilter.start}' AND p.end_delivery_time <= '${deliveryTimeFilter.end}'`;
    }

    if (priceOrderFilter === "ASC" || priceOrderFilter === "DESC") {
        sql += ` ORDER BY (
            SELECT MIN(pq.price)
            FROM productQuantity pq
            WHERE pq.product_id = p.id
        ) ${priceOrderFilter}`;
    }
    console.log(sql);
    return await db.query(sql);
}

const filterByDeliveryTime = async (start, end) => {
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite, 
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants
        FROM 
            products p
        JOIN 
            subCategory s ON p.subcat_id = s.id
        JOIN 
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id
        WHERE
            p.start_delivery_time >= '` + start + `' AND p.end_delivery_time <= '` + end + `'`;
    return await db.query(sql);
}

const sortByPriceOrder = async (order) => {
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.start_delivery_time AS product_start_delivery_time,
            p.end_delivery_time AS product_end_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite, 
            (
                SELECT i.image
                FROM images i
                WHERE i.product_id = p.id
                LIMIT 1
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM (
                    SELECT pq.quantity_variant, pq.price
                    FROM productQuantity pq
                    WHERE pq.product_id = p.id
                    ORDER BY pq.price ASC
                    LIMIT 1
                ) AS pq
            ) AS quantity_variants
        FROM 
            products p
        JOIN 
            subCategory s ON p.subcat_id = s.id
        JOIN 
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id
        ORDER BY (
            SELECT MIN(pq.price)
            FROM productQuantity pq
            WHERE pq.product_id = p.id
        ) ` + order;
    return await db.query(sql);
}

module.exports = {
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
};