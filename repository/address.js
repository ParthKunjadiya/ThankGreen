const db = require('../util/database');

const insertAddress = async (profileImageUrl, name, email, hashedPw, countryCode, phoneNumber) => {
    return await db.execute(
        'INSERT INTO ThankGreen.address (name, email, password, profileImageUrl, country_code, phone_number, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPw, profileImageUrl, countryCode, phoneNumber, 1234]
    ).then(result => {
        console.log(result)
        // Extract the auto-generated ID from the result object
        const insertedId = result[0].insertId;
        return { userId: insertedId };
    }).catch(error => {
        throw error;
    });
}

const getAddress = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = 'SELECT * FROM ThankGreen.address WHERE ';
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.execute(sql, values);
}

const updateAddress = async (hashedNewPassword, userId) => {
    return await db.query("UPDATE ThankGreen.address SET password = ?, resetToken = NULL, resetTokenExpiry = NULL where id=?", [hashedNewPassword, userId])
}

module.exports = {
    insertAddress,
    getAddress,
    updateAddress
};