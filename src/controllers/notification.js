const admin = require('../util/firebaseConfig');

exports.sendNotification = async (deviceToken, body) => {
    const message = {
        notification: {
            title: "Order Notification",
            body: body
        },
        token: deviceToken
    }

    admin.messaging()
        .send(message)
        .then((response) => {
            return {
                status: "success",
                statusCode: 200,
                msg: response
            };
        })
        .catch((error) => {
            return {
                status: "error",
                statusCode: 404,
                msg: error
            };
        })
}