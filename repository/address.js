const db = require('../util/database');

const insertAddress = async ({ userId, address_type, address, state, country, zip_code, latitude, longitude }) => {
    return await db.execute(
        'INSERT INTO ThankGreen.address (user_id, address_type, address, state, country, zip_code, latitude, longitude ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, address_type, address, state, country, zip_code, latitude, longitude]
    )
}

const getAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = 'SELECT * FROM ThankGreen.address WHERE ';
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.execute(sql, values);
}

const updateAddress = async ({ userId, address_id, address_type, address, state, country, zip_code, latitude, longitude }) => {
    return await db.query("UPDATE ThankGreen.address SET address_type = ?, address = ?, state = ?, country=?, zip_code = ?, latitude = ?, longitude = ? WHERE (id=? AND user_id = ?)", [address_type, address, state, country, zip_code, latitude, longitude, address_id, userId])
}

const deleteAddress = async ({ userId, address_id }) => {
    return await db.query("DELETE FROM ThankGreen.address WHERE (id = ? AND user_id = ?)", [address_id, userId])
}

module.exports = {
    insertAddress,
    getAddress,
    updateAddress,
    deleteAddress
};