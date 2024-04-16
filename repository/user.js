const db = require('../util/database');

const insertUser = async (name, email, password, countryCode, phoneNumber) => {
    return await db.query(
        'INSERT INTO users (name, email, password, country_code, phone_number, referral_code) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, password, countryCode, phoneNumber, 1234]
    )
}

const getUserData = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = 'SELECT * FROM users WHERE ';
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const updateUserProfileImage = async ({ userId, profileImageUrl }) => {
    return await db.query(`UPDATE users SET profileImageUrl = ? WHERE (id = ?)`, [profileImageUrl, userId])
}

const updateUserData = async ({ userId, name, email, phone_number }) => {
    const sql = `UPDATE users SET name = '${name}', email = '${email}', phone_number = '${phone_number}' WHERE (id = ${userId})`;
    return await db.query(sql)
}

const updateUserPassword = async (userId, hashedNewPassword) => {
    return await db.query(`UPDATE users SET password = ? WHERE (id = ?)`, [hashedNewPassword, userId])
}

const setResetTokenToUser = async (email, resetToken, resetTokenExpiry) => {
    return await db.query(`UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE (email = ?)`, [resetToken, resetTokenExpiry, email])
}

const updatePasswordAndToken = async (hashedNewPassword, userId) => {
    return await db.query("UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL where id=?", [hashedNewPassword, userId])
}

module.exports = {
    insertUser,
    getUserData,
    updateUserProfileImage,
    updateUserData,
    updateUserPassword,
    setResetTokenToUser,
    updatePasswordAndToken
};