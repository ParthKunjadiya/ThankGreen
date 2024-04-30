const db = require('../util/database');

const insertAddress = async ({ user_id, address_type, address, state, country, zip_code, latitude, longitude }) => {
    let sql = `INSERT INTO address SET ?`

    let params = { user_id, address_type, address, state, country, zip_code, latitude, longitude }
    return await db.query(sql, params)
}

const getAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT * FROM address WHERE `;
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const updateAddress = async ({ userId, address_id, address_type, address, state, country, zip_code, latitude, longitude }) => {
    let sql = `UPDATE address SET address_type = ?, address = ?, state = ?, country=?, zip_code = ?, latitude = ?, longitude = ? WHERE (id=? AND user_id = ?)`

    let params = [address_type, address, state, country, zip_code, latitude, longitude, address_id, userId]
    return await db.query(sql, params)
}

const deleteAddress = async ({ userId, address_id }) => {
    let sql = `DELETE FROM address WHERE (id = ? AND user_id = ?)`

    let params = [address_id, userId]
    return await db.query(sql, params)
}

module.exports = {
    insertAddress,
    getAddress,
    updateAddress,
    deleteAddress
};