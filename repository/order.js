const db = require('../util/database');

const getCurrentOrders = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            (
                SELECT t.status
                FROM trackOrder t
                WHERE t.order_id = o.id
                ORDER BY t.createdAt DESC
                LIMIT 1
            ) AS order_status,
            (
                SELECT SUM(oi.quantity)
                FROM orderItems oi
                WHERE oi.order_id = o.id
            ) AS total_quantity,
            o.delivery_on
        FROM
            orders o
        WHERE
            o.user_id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('placed', 'packed', 'shipped')
            )
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const getPastOrders = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            o.id AS order_number,
            o.order_amount AS total_amount,
            (
                SELECT t.status
                FROM trackOrder t
                WHERE t.order_id = o.id
                ORDER BY t.createdAt DESC
                LIMIT 1
            ) AS order_status,
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
            o.user_id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('delivered', 'cancel')
            )
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const getOrderByOrderId = async ({ userId, orderId }) => {
    let sql = `SELECT
            o.createdAt AS Order_date,
            o.id AS order_number,
            (
                SELECT t.status
                FROM trackOrder t
                WHERE t.order_id = o.id
                ORDER BY t.createdAt DESC
                LIMIT 1
            ) AS order_status,
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'subcategory_name', s.name,
                        'products', (
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
                                    'quantity', oi.quantity,
                                    'quantity_variant', oi.quantity_variant,
                                    'order_price', oi.price
                                )
                            )
                            FROM orderItems oi
                            JOIN products p ON oi.product_id = p.id
                            WHERE oi.order_id = o.id AND p.subcat_id = s.id
                        )
                    )
                )
                FROM subCategory s
                WHERE EXISTS (
                    SELECT 1
                    FROM orderItems oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = o.id AND p.subcat_id = s.id
                    LIMIT 1
                )
            ) AS Product_details,
            (
                SELECT JSON_OBJECT('address_type', a.address_type, 'address', a.address, 'landmark', a.landmark, 'zip_code', a.zip_code, 'latitude', a.latitude, 'longitude', a.longitude)
                FROM orderAddress a
                WHERE o.address_id = a.id
            ) AS delivery_address,
            o.delivery_on,
            (
                SELECT JSON_OBJECT(
                    'invoice_number', p.invoice_number,
                    'type', p.type,
                    'total_quantity', (SELECT SUM(oi.quantity) FROM orderItems oi WHERE oi.order_id = o.id),
                    'gross_amount', ROUND(o.gross_amount, 2),
                    'discount_amount', o.discount_amount,
                    'delivery_charge', o.delivery_charge,
                    'order_amount', ROUND(o.order_amount, 2)
                )
            ) AS payment_details
        FROM
            orders o
        JOIN
            paymentDetails p ON o.id = p.order_id
        WHERE
            o.user_id = ? AND o.id = ? AND (
                (
                    SELECT t.status
                    FROM trackOrder t
                    WHERE t.order_id = o.id
                    ORDER BY t.createdAt DESC
                    LIMIT 1
                ) IN ('placed', 'packed', 'shipped', 'delivered', 'cancel')
            )`

    let params = [userId, orderId]
    return await db.query(sql, params)
}

const getProductQuantityDetail = async ({ id, product_id }) => {
    let sql = `SELECT pq.quantity_variant, pq.selling_price AS price FROM productQuantity pq WHERE id = ? AND product_id = ?`

    let params = [id, product_id]
    return await db.query(sql, params)
}

const addOrderAddressDetail = async (addressDetail) => {
    const { address_type, address, landmark, zip_code, latitude, longitude } = addressDetail
    let sql = `INSERT INTO orderAddress SET ?`

    let params = { address_type, address, landmark, zip_code, latitude, longitude }
    return await db.query(sql, params)
}

const addOrderDetail = async ({ user_id, address_id, gross_amount, order_amount, delivery_charge, delivery_on }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = { user_id, address_id, gross_amount, order_amount, delivery_charge, delivery_on }
    return await db.query(sql, params)
}

const addOrderItemDetail = async ({ order_id, product_id, quantity, quantity_variant, price }) => {
    let sql = `INSERT INTO orderItems SET ?`

    let params = { order_id, product_id, quantity, quantity_variant, price }
    return await db.query(sql, params)
}

const addOrderStatusDetail = async ({ order_id, status }) => {
    let sql = `INSERT INTO trackOrder SET ?`

    let params = { order_id, status }
    return await db.query(sql, params)
}

const addPaymentDetail = async ({ order_id, invoice_number, type, status }) => {
    let sql = `INSERT INTO paymentDetails SET ?`

    let params = { order_id, invoice_number, type, status }
    return await db.query(sql, params)
}

const getOrderStatus = async (orderId) => {
    let sql = `SELECT t.status
            FROM trackOrder t
            WHERE t.order_id = ?
            ORDER BY t.createdAt DESC
            LIMIT 1`

    let params = [orderId]
    return await db.query(sql, params)
}

const updateOrderStatus = async (orderId, status) => {
    let sql = `INSERT INTO trackOrder SET ?`

    let params = { order_id: orderId, status }
    return await db.query(sql, params)
}

const updatePaymentDetails = async (paymentIntent, status) => {
    const paymentId = paymentIntent.id;
    let sql = `UPDATE paymentDetails SET status = ? WHERE id = ?`

    let params = [status, paymentId]
    return await db.query(sql, params)
}

const addRating = async (orderId, rating, feedback) => {
    let sql = `INSERT INTO rating SET ?`

    let params = { order_id: orderId, rating, feedback }
    return await db.query(sql, params)
}

const trackOrder = async (orderId) => {
    let sql = `SELECT JSON_ARRAYAGG(JSON_OBJECT('status',  t.status, 'time',  t.createdAt)) AS order_status
        FROM trackOrder t
        LEFT JOIN orders o ON t.order_id = o.id
        WHERE t.order_id = ? AND t.status IN ('placed', 'packed', 'shipped', 'delivered');`

    let params = [orderId]
    return await db.query(sql, params)
}

const cancelOrder = async (orderId, reason) => {
    let sql = `UPDATE orders SET is_cancel = 1, cancel_reason = ? WHERE id=?`

    let params = [reason, orderId]
    return await db.query(sql, params)
}

module.exports = {
    getCurrentOrders,
    getPastOrders,
    getOrderByOrderId,
    getProductQuantityDetail,
    addOrderAddressDetail,
    addOrderDetail,
    addOrderItemDetail,
    addOrderStatusDetail,
    addPaymentDetail,
    getOrderStatus,
    updateOrderStatus,
    updatePaymentDetails,
    addRating,
    trackOrder,
    cancelOrder
};