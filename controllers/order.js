const {
    getOrders,
    addOrderDetail,
    addOrderItemDetail
} = require('../repository/order');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 2;
        const offset = (page - 1) * limit;
        const [orders] = await getOrders({ userId: req.userId, offset, limit })
        if (!orders.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'No Orders found.',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Orders fetched!',
                data: orders
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}

exports.postOrder = async (req, res, next) => {
    try {
        const { address_id, products, delivery_on } = req.body;
        let order_total = 0;
        products.forEach(product => {
            order_total += product.quantity * product.price
        });

        let deliveryCharge = order_total > 599 ? 0 : (order_total * 0.05).toFixed(2)
        const [order] = await addOrderDetail({ user_id: req.userId, address_id, order_amount: order_total, delivery_charge: deliveryCharge, delivery_on })
        if (!order.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Try again',
                })
            );
        }
        const orderId = order.insertId;

        products.forEach(async (product) => {
            let product_id = product.id;
            let quantity = product.quantity;
            let quantity_variant = product.quantity_variant;
            let price = product.price;
            await addOrderItemDetail({ order_id: orderId, product_id, quantity, quantity_variant, price })
        });
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order created successfully.',
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error"
            })
        );
    }
}