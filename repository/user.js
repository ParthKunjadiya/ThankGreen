const db = require('../util/database');

const insertUser = async (profileImageUrl, name, email, hashedPw, countryCode, phoneNumber) => {
    return await db.execute(
        'INSERT INTO ThankGreen.users (name, email, password, profileImageUrl, country_code, phone_number, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
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

const getUserData = async (key) => {
    const keys = Object.keys(key);
    const values = Object.values(key);

    let sql = 'SELECT * FROM ThankGreen.users WHERE ';
    sql += keys.map(key => `${key} = ?`).join(' AND ');

    return await db.execute(sql, values);
}

const updateUserProfileImage = async ({ userId, profileImageUrl }) => {
    return await db.execute(`UPDATE ThankGreen.users SET profileImageUrl = ? WHERE (id = ?)`, [profileImageUrl, userId])
}

const updateUserData = async ({ userId, name, email, phone_number }) => {
    return await db.execute(`UPDATE ThankGreen.users SET name = ?, email = ?, phone_number = ? WHERE (id = ?)`, [name, email, phone_number, userId])
}

const updateUserPassword = async (userId, hashedNewPassword) => {
    return await db.execute(`UPDATE ThankGreen.users SET password = ? WHERE (id = ?)`, [hashedNewPassword, userId])
}

const verifiedUser = async (userId) => {
    return await db.execute('UPDATE ThankGreen.users SET is_verify = 1 WHERE id = ?', [userId])
}

const setResetTokenToUser = async (email, resetToken, resetTokenExpiry) => {
    return await db.execute(`UPDATE ThankGreen.users SET resetToken = ?, resetTokenExpiry = ? WHERE (email = ?)`, [resetToken, resetTokenExpiry, email])
}

const updatePasswordAndToken = async (hashedNewPassword, userId) => {
    return await db.query("UPDATE ThankGreen.users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL where id=?", [hashedNewPassword, userId])
}

module.exports = {
    insertUser,
    getUserData,
    updateUserProfileImage,
    updateUserData,
    updateUserPassword,
    verifiedUser,
    setResetTokenToUser,
    updatePasswordAndToken
};