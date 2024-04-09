const db = require('../util/database');

const getProducts = async ({ userId }) => {
    return await db.execute(
        `SELECT p.id AS product_id, c.name AS category_name, s.name AS subcategory_name, p.title AS product_title, p.description AS product_description, p.available_delivery_time AS product_available_delivery_time, CASE WHEN f.product_id IS NOT NULL THEN true ELSE false END AS is_favorite
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

const getCategories = async () => {
    return await db.execute('SELECT * FROM category');
}

const getFavoriteProducts = async ({ userId }) => {
    return await db.execute(
        `SELECT p.id AS product_id, c.name AS category_name, s.name AS subcategory_name, p.title AS product_title, p.description AS product_description, p.available_delivery_time AS product_available_delivery_time
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

module.exports = {
    getProducts,
    getCategories,
    getFavoriteProducts
};