const db = require('../util/database');

const insertCard = async ({ userId, number, holder_name, expiry, cvv }) => {
    return await db.execute(
        'INSERT INTO cards (user_id, number, holder_name, expiry, cvv) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, number, holder_name, expiry, cvv]
    )
}

const getCard = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = 'SELECT * FROM cards WHERE ';
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.execute(sql, values);
}

const updateCard = async ({ userId, card_id, number, holder_name, expiry, cvv }) => {
    return await db.query("UPDATE cards SET number = ?, holder_name = ?, expiry = ?, cvv=? WHERE (id=? AND user_id = ?)", [number, holder_name, expiry, cvv, card_id, userId])
}

const deleteCard = async ({ userId, card_id }) => {
    return await db.query("DELETE FROM cards WHERE (id = ? AND user_id = ?)", [card_id, userId])
}

module.exports = {
    insertCard,
    getCard,
    updateCard,
    deleteCard
};