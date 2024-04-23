require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
    getOrders,
    addOrderDetail,
    addOrderItemDetail,
    addPaymentDetail
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
        const { address_id, products, delivery_on, payment_method } = req.body;
        let order_sub_total = 0;
        products.forEach(product => {
            order_sub_total += product.quantity * product.price
        });

        let deliveryCharge = order_sub_total > 599 ? 0 : (order_sub_total * 0.05).toFixed(2)
        let order_total = parseFloat(order_sub_total) + parseFloat(deliveryCharge);
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
        const [order] = await addOrderDetail({ user_id: req.userId, address_id, order_amount: order_sub_total, delivery_charge: deliveryCharge, delivery_on })
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
            let { id: product_id, quantity, quantity_variant, price } = product;
            await addOrderItemDetail({ order_id: orderId, product_id, quantity, quantity_variant, price })
        });

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
        console.log(paymentIntent)

        const paymentDetail = await addPaymentDetail({
            order_id: orderId,
            invoice_number: generateInvoiceNumber(),
            type: payment_method === 'online' ? 'Online Payment' : 'COD',
            status: 'Pending'
        });
        if (!paymentDetail.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Failed to add payment details',
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
                    stripe_payment_intent_client_secret: payment_method === 'online' ? paymentIntent.client_secret : 'payment: COD'
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