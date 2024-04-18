require("dotenv").config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '2h' });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
}

const verifyRefreshToken = (refreshToken) => {
    let decodedToken;
    try {
        decodedToken = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
        console.log(err);
        return {
            status: "error",
            statusCode: 401,
            msg: 'Invalid refresh token.'
        };
    }
    return {
        status: "success",
        statusCode: 200,
        msg: 'Valid refresh token',
        data: decodedToken
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};