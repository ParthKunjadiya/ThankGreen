const db = require('../util/database');

const insertCard = async ({ user_id, number, holder_name, expiry, cvv }) => {
    let sql = `INSERT INTO cards SET ?`

    let params = { user_id, number, holder_name, expiry, cvv }
    return await db.query(sql, params)
}

const getCard = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT * FROM cards WHERE `;
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const updateCard = async ({ userId, card_id, number, holder_name, expiry, cvv }) => {
    let sql = `UPDATE cards SET number = ?, holder_name = ?, expiry = ?, cvv=? WHERE (id=? AND user_id = ?)`

    let params = [number, holder_name, expiry, cvv, card_id, userId]
    return await db.query(sql, params)
}

const deleteCard = async ({ userId, card_id }) => {
    let sql = `DELETE FROM cards WHERE (id = ? AND user_id = ?)`

    let params = [card_id, userId]
    return await db.query(sql, params)
}

module.exports = {
    insertCard,
    getCard,
    updateCard,
    deleteCard
};