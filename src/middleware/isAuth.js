const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET;
const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.isAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 401,
                msg: 'Not authenticated.',
            })
        );
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: err.message === 'invalid signature' ? 401 : 403,
                msg: err.message
            })
        );
    }
    req.userId = decodedToken.userId;
    next();
}