const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;

const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '2d' });
}

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: '1y' });
}

const verifyRefreshToken = (refreshToken) => {
    let decodedToken;
    try {
        decodedToken = jwt.verify(refreshToken, JWT_SECRET);
    } catch (err) {
        console.log(err);
        return {
            status: "error",
            statusCode: err.message === 'invalid signature' ? 401 : 403,
            msg: err.message
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