const db = require('../util/database');

const getOrders = async ({ userId, offset, limit }) => {
    let sql = `SELECT
            o.id AS order_id,
            (
                SELECT JSON_OBJECT('address_type', a.address_type, 'delivery_address', a.address, 'zip_code', a.zip_code)
                FROM address a
                WHERE o.address_id = a.id
            ) AS address,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('product_id', orderItem.product_id, 'quantity', orderItem.quantity, 'quantity_variant', orderItem.quantity_variant, 'order_price', orderItem.price))
                FROM (
                    SELECT oi.product_id, oi.quantity, oi.quantity_variant, oi.price
                    FROM orderItems oi
                    WHERE oi.order_id = o.id
                ) AS orderItem
            ) AS orderItems,
            o.order_amount,
            o.discount_amount,
            o.delivery_charge,
            p.invoice_number,
            p.type,
            p.status,
            o.order_status,
            o.delivery_on
        FROM
            orders o
        JOIN
            paymentDetails p ON o.id = p.order_id
        WHERE
            o.user_id = ?
        LIMIT ?, ?`

    let params = [userId, offset, limit]
    return await db.query(sql, params)
}

const addOrderDetail = async ({ user_id, address_id, order_amount, delivery_charge, delivery_on }) => {
    let sql = `INSERT INTO orders SET ?`

    let params = {user_id, address_id, order_amount, delivery_charge, delivery_on}
    return await db.query(sql, params)
}

const addOrderItemDetail = async ({ order_id, product_id, quantity, quantity_variant, price }) => {
    let sql = `INSERT INTO orderItems SET ?`

    let params = {order_id, product_id, quantity, quantity_variant, price}
    return await db.query(sql, params)
}

module.exports = {
    getOrders,
    addOrderDetail,
    addOrderItemDetail
};