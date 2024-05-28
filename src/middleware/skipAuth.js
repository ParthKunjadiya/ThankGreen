const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const { sendHttpResponse, generateResponse } = require("../helper/response");

exports.isLogIn = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        next();
        return;
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, JWT_SECRET);
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: err.message === 'invalid signature' ? 401 : 403,
                msg: err.message
            })
        );
    }
};