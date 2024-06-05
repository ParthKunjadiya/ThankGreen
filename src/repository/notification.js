const db = require('../util/database');

const getNotification = async ({ userId }) => {
    let sql = `SELECT id as Notification_id, message FROM notifications WHERE user_id = ?`
    let params = [userId]
    return await db.query(sql, params)
}

const updateOrderNotification = async (userId, notificationBody) => {
    let sql = `UPDATE notifications SET message = ? WHERE user_id = ?`
    let params = [notificationBody, userId]
    return await db.query(sql, params);
};

module.exports = {
    getNotification,
    updateOrderNotification
};