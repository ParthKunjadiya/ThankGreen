const db = require('../util/database');

const insertUser = async ({ name, email, password, countryCode, phoneNumber, referralCode, fromGoogle }) => {
    let sql = `INSERT INTO users SET ?`

    let params = { name, email, password, country_code: countryCode, phone_number: phoneNumber, referral_with: referralCode, from_google: fromGoogle }
    return await db.query(sql, params)
}

const insertReferralDetail = async (userId, referralCode) => {
    let sql = `INSERT INTO referral SET ?`

    let params = { user_id: userId, code: referralCode }
    return await db.query(sql, params)
}

const getUserData = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = `SELECT * FROM users WHERE `
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.query(sql, values);
}

const updateUserProfileImage = async ({ userId, profileImageUrl }) => {
    let sql = `UPDATE users SET profileImageUrl = ? WHERE (id = ?)`

    let params = [profileImageUrl, userId]
    return await db.query(sql, params)
}

const updateUserData = async ({ userId, updatedFields }) => {
    let sql = `UPDATE users SET ? WHERE (id = ?)`

    let params = [updatedFields, userId]
    return await db.query(sql, params)
}

const updateUserPassword = async (userId, hashedNewPassword) => {
    let sql = `UPDATE users SET password = ? WHERE (id = ?)`

    let params = [hashedNewPassword, userId]
    return await db.query(sql, params)
}

const setResetTokenToUser = async (email, resetToken, resetTokenExpiry) => {
    let sql = `UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE (email = ?)`

    let params = [resetToken, resetTokenExpiry, email]
    return await db.query(sql, params)
}

const updatePasswordAndToken = async (hashedNewPassword, userId) => {
    let sql = `UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL where id=?`

    let params = [hashedNewPassword, userId]
    return await db.query(sql, params)
}

const getDeviceToken = async (userId) => {
    let sql = `SELECT * FROM devices WHERE user_id = ?`

    let params = [userId]
    return await db.query(sql, params)
}

const storeDeviceToken = async ({ userId, deviceToken }) => {
    let sql = `INSERT INTO devices SET ?`

    let params = { device_token: deviceToken, user_id: userId }
    return await db.query(sql, params)
}

module.exports = {
    insertUser,
    insertReferralDetail,
    getUserData,
    updateUserProfileImage,
    updateUserData,
    updateUserPassword,
    setResetTokenToUser,
    updatePasswordAndToken,
    getDeviceToken,
    storeDeviceToken
};