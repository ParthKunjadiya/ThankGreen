const db = require('../util/database');

const getProducts = async ({ userId }) => {
    return await db.query(
        `SELECT p.id AS product_id, c.name AS category_name, s.name AS subcategory_name, p.title AS product_title, p.description AS product_description, p.available_delivery_time AS product_available_delivery_time, CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite, 
        (
            SELECT JSON_ARRAYAGG(i.image)
            FROM images i
            WHERE i.product_id = p.id
        ) AS images
        FROM 
            products p
        JOIN 
            subCategory s ON p.subcat_id = s.id
        JOIN 
            category c ON s.category_id = c.id
        LEFT JOIN 
            favorites f ON p.id = f.product_id AND f.user_id = ?`,
        [userId]
    );
}

const getProduct = async (productId) => {
    return await db.query(
        `SELECT p.id AS product_id, c.name AS category_name, s.name AS subcategory_name, p.title AS product_title, p.description AS product_description, p.available_delivery_time AS product_available_delivery_time, CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite, 
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

const getCategories = async () => {
    return await db.query('SELECT * FROM category');
}

const getSubCategory = async (categoryId) => {
    return await db.query('SELECT s.*, c.name AS category_name FROM subCategory s JOIN category c ON s.category_id = c.id WHERE category_id = ?', [categoryId]);
}

const getFavoriteProducts = async ({ userId }) => {
    return await db.query(
        `SELECT p.id AS product_id, c.name AS category_name, s.name AS subcategory_name, p.title AS product_title, p.description AS product_description, p.available_delivery_time AS product_available_delivery_time, 
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

module.exports = {
    getProducts,
    getProduct,
    getCategories,
    getSubCategory,
    getFavoriteProducts,
    getFavoriteProduct,
    postFavoriteProduct,
    deleteFavoriteProduct
};