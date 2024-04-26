const db = require('../util/database');

const getCurrentOrders = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            o.order_status,
            (
                SELECT SUM(oi.quantity)
                FROM orderItems oi
                WHERE oi.order_id = o.id
            ) AS total_quantity,
            o.delivery_on
        FROM
            orders o
        WHERE
            o.user_id = ? AND o.order_status IN ('placed', 'packed', 'shipped')
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const getPastOrders = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            o.order_status,
            (
                SELECT SUM(oi.quantity)
                FROM orderItems oi
                WHERE oi.order_id = o.id
            ) AS total_quantity,
            o.delivery_on,
            r.rating
        FROM
            orders o
        LEFT JOIN
            rating r ON o.id = r.order_id
        WHERE
            o.user_id = ? AND o.order_status = 'delivery'
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const getOrderByOrderId = async ({ userId, orderId }) => {
    let sql = `SELECT
            o.createdAt AS Order_date,
            o.id AS order_number,
            o.order_status,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'product_id', oi.product_id,
                        'product_name', p.title,
                        'product_image', (
                            SELECT image
                            FROM images
                            WHERE product_id = p.id
                            ORDER BY id ASC
                            LIMIT 1
                        ),
                        'subcategory_name', s.name,
                        'quantity', oi.quantity,
                        'quantity_variant', oi.quantity_variant,
                        'order_price', oi.price
                    )
                )
                FROM orderItems oi
                JOIN products p ON oi.product_id = p.id
                JOIN subCategory s ON p.subcat_id = s.id
                WHERE oi.order_id = o.id
            ) AS Product_details,
            (
                SELECT JSON_OBJECT('address_type', a.address_type, 'delivery_address', a.address, 'zip_code', a.zip_code)
                FROM address a
                WHERE o.address_id = a.id
            ) AS address,
            o.delivery_on,
            (
                SELECT JSON_OBJECT(
                    'invoice_number', p.invoice_number,
                    'type', p.type,
                    'total_quantity', (SELECT SUM(oi.quantity) FROM orderItems oi WHERE oi.order_id = o.id),
                    'gross_amount', o.gross_amount,
                    'discount_amount', o.discount_amount,
                    'delivery_charge', o.delivery_charge,
                    'order_amount', o.order_amount
                )
            ) AS payment_details
        FROM
            orders o
        JOIN
            paymentDetails p ON o.id = p.order_id
        WHERE
            o.user_id = ? AND o.id = ? AND o.order_status IN ('placed', 'packed', 'shipped', 'delivery')`

    let params = [userId, orderId]
    return await db.query(sql, params)
}

const getProductQuantityDetail = async ({ id, product_id }) => {
    let sql = `SELECT pq.quantity_variant, pq.selling_price AS price FROM productQuantity pq WHERE id = ? AND product_id = ?`

    let params = [id, product_id]
    return await db.query(sql, params)
}

const addOrderDetail = async ({ user_id, address_id, gross_amount, order_amount, delivery_charge, order_status, delivery_on }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = { user_id, address_id, gross_amount, order_amount, delivery_charge, order_status, delivery_on }
    return await db.query(sql, params)
}

const addOrderItemDetail = async ({ order_id, product_id, quantity, quantity_variant, price }) => {
    let sql = `INSERT INTO orderItems SET ?`

    let params = { order_id, product_id, quantity, quantity_variant, price }
    return await db.query(sql, params)
}

const addPaymentDetail = async ({ order_id, invoice_number, type, status }) => {
    let sql = `INSERT INTO paymentDetails SET ?`

    let params = { order_id, invoice_number, type, status }
    return await db.query(sql, params)
}

const checkOrderStatus = async (order_id) => {
    let sql = `SELECT * FROM orders WHERE order_status = 'delivery' AND id = ?`

    let params = [order_id]
    return await db.query(sql, params)
}

const updateOrderStatus = async (orderId, status) => {
    let sql = `UPDATE orders SET status = ? WHERE id = ?`

    let params = [status, orderId]
    return await db.query(sql, params)
}

const updatePaymentDetails = async (paymentIntent, status) => {
    const paymentId = paymentIntent.id;
    let sql = `UPDATE paymentDetails SET status = ? WHERE id = ?`

    let params = [status, paymentId]
    return await db.query(sql, params)
}

const addRating = async (order_id, rating, feedback) => {
    let sql = `INSERT INTO rating SET ?`

    let params = { order_id, rating, feedback }
    return await db.query(sql, params)
}

module.exports = {
    getCurrentOrders,
    getPastOrders,
    getOrderByOrderId,
    getProductQuantityDetail,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    checkOrderStatus,
    updateOrderStatus,
    updatePaymentDetails,
    addRating
};