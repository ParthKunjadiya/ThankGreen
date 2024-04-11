const db = require('../util/database');

const getProducts = async () => {
    return await db.query(
        `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
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
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite,
            (
                SELECT JSON_ARRAYAGG(i.image)
                FROM images i
                WHERE i.product_id = p.id
            ) AS images,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('quantity_variant', pq.quantity_variant, 'price', pq.price))
                FROM productQuantity pq
                WHERE pq.product_id = p.id
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
            p.id = ?`,
        [productId]
    );
}

const getProductBySubCategoryId = async (subCategoryId) => {
    return await db.query(
        `SELECT
            p.id AS product_id,
            p.title AS product_title,
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
            CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite,
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
            ) AS quantity_variants
        FROM
            products p
        LEFT JOIN
            favorites f ON p.id = f.product_id
        WHERE
            p.subcat_id = ?`,
        [subCategoryId]
    );
}

const getCategories = async () => {
    return await db.query('SELECT * FROM category');
}

const getSubCategory = async (categoryId) => {
    return await db.query('SELECT s.*, c.name AS category_name FROM subCategory s JOIN category c ON s.category_id = c.id WHERE category_id = ?', [categoryId]);
}

const getFavoriteProducts = async ({ userId }) => {
    return await db.query(
        `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
            (
                SELECT JSON_ARRAYAGG(i.image)
                FROM images i
                WHERE i.product_id = p.id
            ) AS images
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

const filterByPrice = async (low, high) => {
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
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
            (
                SELECT MIN(pq.price)
                FROM productQuantity pq
                WHERE pq.product_id = p.id
            ) BETWEEN ` + low + ` AND ` + high;
    return await db.query(sql);
}

const sortPriceByOrder = async (order) => {
    let sql = `SELECT
            p.id AS product_id,
            c.name AS category_name,
            s.name AS subcategory_name,
            p.title AS product_title,
            p.description AS product_description,
            p.available_delivery_time AS product_available_delivery_time,
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
        )` + order;
    return await db.query(sql);
}

module.exports = {
    getProducts,
    getProductByProductId,
    getProductBySubCategoryId,
    getCategories,
    getSubCategory,
    getFavoriteProducts,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct,
    filterByPrice,
    sortPriceByOrder
};