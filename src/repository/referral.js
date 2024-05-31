const db = require('../util/database');

const getReferralDetails = async ({ userId }) => {
    let sql = `SELECT * FROM referral WHERE user_id = ?`
    let params = [userId]
    return await db.query(sql, params)
}

const getTotalInvite = async (referralCode) => {
    let sql = `SELECT COUNT(*) AS count FROM users WHERE referral_with = ?`
    let params = [referralCode]
    return await db.query(sql, params)
}

module.exports = {
    getReferralDetails,
    getTotalInvite
};