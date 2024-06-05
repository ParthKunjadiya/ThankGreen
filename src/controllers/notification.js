const axios = require('axios');

const {
    getNotification
} = require('../repository/notification');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.sendNotification = async (deviceToken, body) => {
    const message = {
        to: deviceToken,
        sound: 'default',
        title: 'Order Notification',
        body: body,
        data: { body },
    };

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        return response
    } catch (error) {
        return error
    }
};

exports.getNotification = async (req, res, next) => {
    try {
        const [notification] = await getNotification({ userId: req.userId });

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Referral Details',
                data: {
                    notification
                }
            })
        );
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
}


// Firebase notification handlers
// const admin = require('../util/firebaseConfig');

// exports.sendNotification = async (deviceToken, body) => {
//     console.log(deviceToken)
//     const message = {
//         notification: {
//             title: "Order Notification",
//             body: body
//         },
//         token: deviceToken
//     }

//     admin.messaging()
//         .send(message)
//         .then((response) => {
//             console.log(response)
//         })
//         .catch((error) => {
//             console.log(error)
//         })
// }