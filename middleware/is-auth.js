require("dotenv").config();

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.isAuth = (req, res, next) => {
    const authHeader = req.get('Authorization');
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
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
    if (!decodedToken) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 401,
                msg: 'Not authenticated.',
            })
        );
    }
    req.userId = decodedToken.userId;
    next();
}