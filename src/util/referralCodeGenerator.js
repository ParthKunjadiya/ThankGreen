const crypto = require("crypto");

const generateReferralCode = (userId, email, phoneNumber) => {
    const baseString = `${email}${phoneNumber || ''}${userId}`;
    return crypto.createHash('sha256').update(baseString).digest('hex').substr(0, 8);
};

module.exports = {
    generateReferralCode
};