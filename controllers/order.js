require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
    getCurrentOrders,
    getPastOrders,
    getOrderByOrderId,
    getProductQuantityDetail,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail,
    checkOrderStatus,
    addRating
} = require('../repository/order');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getCurrentOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const [currentOrders] = await getCurrentOrders({ userId: req.userId, offset, limit })
        if (!currentOrders.length) {
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
                data: currentOrders
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

exports.getPastOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        const [pastOrders] = await getPastOrders({ userId: req.userId, offset, limit })
        if (!pastOrders.length) {
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
                data: pastOrders
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

exports.getOrderByOrderId = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const [order] = await getOrderByOrderId({ userId: req.userId, orderId })
        if (!order.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Order Detail not found!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order Detail fetched!',
                data: order
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
        const { address_id, products, delivery_on, payment_method } = req.body;

        let order_sub_total = 0;
        let ProductQuantity;
        let orderItems = [];
        await Promise.all(
            products.map(async (product) => {
                [ProductQuantity] = await getProductQuantityDetail({ id: product.productQuantity_id, product_id: product.id });
                order_sub_total += parseFloat(product.quantity) * parseFloat(ProductQuantity[0].price)

                const orderItem = {
                    product_id: product.id,
                    quantity: product.quantity,
                    quantity_variant: ProductQuantity[0].quantity_variant,
                    price: ProductQuantity[0].price
                };
                orderItems.push(orderItem);
            })
        );
        order_sub_total = order_sub_total.toFixed(2);

        let discount_amount = 0;
        let deliveryCharge = order_sub_total > 599 ? 0 : (order_sub_total * 0.05).toFixed(2)
        let order_total = parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discount_amount);

        if (!address_id && !delivery_on && !payment_method) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Total Charge: ',
                    data: {
                        sub_total: order_sub_total,
                        delivery_charges: deliveryCharge,
                        total: order_total
                    }
                })
            );
        }

        // add order in database
        const [order] = await addOrderDetail({ user_id: req.userId, address_id, gross_amount: order_sub_total, delivery_charge: deliveryCharge, order_amount: order_total, order_status: "pending", delivery_on })
        if (!order.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Failed to add order detail.',
                })
            );
        }
        const orderId = order.insertId;

        // add order Items in database
        await Promise.all(
            orderItems.map(async (orderItem) => {
                let { product_id, quantity, quantity_variant, price } = orderItem;
                await addOrderItemDetail({ order_id: orderId, product_id, quantity, quantity_variant, price })
            })
        );

        let paymentIntent;
        if (payment_method === 'online') {
            const paymentIntentData = {
                payment_method_types: ['card'],
                amount: order_total * 100,
                currency: 'inr',
                description: 'Order payment',
                metadata: { orderId: orderId }
            };
            paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        }
        console.log('paymentIntent: ', paymentIntent)

        const [paymentDetail] = await addPaymentDetail({ order_id: orderId, invoice_number: null, type: payment_method === 'online' ? 'online' : 'COD', status: 'pending' });
        if (!paymentDetail.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Failed to add payment details',
                })
            );
        }

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order created successfully.',
                data: {
                    order_id: orderId,
                    paymentIntent_id: paymentIntent.id,
                    paymentIntent_client_secret: payment_method === 'online' ? paymentIntent.client_secret : 'payment: COD'
                }
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

exports.rateOrder = async (req, res, next) => {
    try {
        const { order_id, rating, feedback } = req.body;
        const [status] = await checkOrderStatus(order_id);
        if (!status.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: `order is not delivered, you can't rating the order`,
                })
            );
        }

        await addRating(order_id, rating, feedback)
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'order rating successfully.'
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