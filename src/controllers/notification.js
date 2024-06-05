const axios = require('axios');

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
        return {
            status: 'success',
            statusCode: 200,
            msg: response.data,
        };
    } catch (error) {
        return {
            status: 'error',
            statusCode: 404,
            msg: error.response ? error.response.data : error.message,
        };
    }
};


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