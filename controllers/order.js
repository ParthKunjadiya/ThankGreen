require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
    getCurrentOrders,
    getPastOrders,
    getOrderByOrderId,
    getProductQuantityDetail,
    addOrderAddressDetail,
    addOrderDetail,
    addOrderItemDetail,
    addOrderStatusDetail,
    addPaymentDetail,
    getOrderStatus,
    updateOrderStatus,
    updatePaymentDetails,
    addRating,
    trackOrder,
    cancelOrder
} = require('../repository/order');

const {
    getAddress
} = require('../repository/address');

const {
    getUserData
} = require('../repository/user');

const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
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
                data: {
                    currentOrders,
                    pastOrders
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

        // validate addressId
        const [userData] = await getUserData({ default_address_id: address_id })
        if (userData.length && userData[0].id !== req.userId) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: `Invalid address_id for current user.`
                })
            );
        }

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
        let order_total = (parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discount_amount)).toFixed(2);

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

        // add orderAddress details in database
        const [address] = await getAddress({ user_id: req.userId, id: address_id })
        const [orders] = await addOrderAddressDetail(address[0])
        let order_address_id = orders.insertId

        // add order in database
        const [order] = await addOrderDetail({ user_id: req.userId, address_id: order_address_id, gross_amount: order_sub_total, delivery_charge: deliveryCharge, order_amount: order_total, delivery_on })
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

        // add order status = 'pending' in trackOrder table
        await addOrderStatusDetail({ order_id: orderId, status: 'pending' })

        let paymentIntent;
        const amountInPaisa = Math.round(order_total * 100);
        if (payment_method === 'online') {
            const paymentIntentData = {
                payment_method_types: ['card'],
                amount: amountInPaisa,
                currency: 'inr',
                payment_method: "pm_card_visa",
                description: 'Order payment',
                metadata: { orderId: orderId }
            };
            paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        }

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
                    paymentIntent_id: paymentIntent ? paymentIntent.id : null,
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

exports.stripeWebhook = async (req, res, next) => {
    const payload = JSON.stringify(req.body);
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_END_POINT_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;

                // Payment succeeded, update order status to 'placed'
                await updateOrderStatus(paymentIntentSucceeded.metadata.orderId, 'placed');
                // Update the payment details table with the payment status
                await updatePaymentDetails(paymentIntentSucceeded, 'paid');
                break;

            case 'payment_intent.canceled':
                const paymentIntentCanceled = event.data.object;
                // Then define and call a function to handle the event payment_intent.canceled
                break;

            case 'payment_intent.created':
                const paymentIntentCreated = event.data.object;
                // Then define and call a function to handle the event payment_intent.created
                break;

            case 'payment_intent.payment_failed':
                const paymentIntentPaymentFailed = event.data.object;

                // Payment failed, update order status to 'cancelled'
                await updateOrderStatus(paymentIntentPaymentFailed.metadata.orderId, 'cancelled');
                // Update the payment details table with the payment status
                await updatePaymentDetails(paymentIntentPaymentFailed, 'failed');
                break;

            case 'payment_intent.processing':
                const paymentIntentProcessing = event.data.object;
                // Then define and call a function to handle the event payment_intent.processing
                break;

            case 'payment_intent.requires_action':
                const paymentIntentRequiresAction = event.data.object;
                // Then define and call a function to handle the event payment_intent.requires_action
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }
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
        const { orderId, rating, feedback } = req.body;
        const [status] = await getOrderStatus(orderId);
        if (!status.length || status[0].status !== 'delivered') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: `order is not delivered, you can't rating the order`,
                })
            );
        }

        await addRating(orderId, rating, feedback)
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

exports.trackOrder = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;

        const [status] = await getOrderStatus(orderId);
        if (!status.length || status[0].status === 'cancel' || status[0].status === 'pending') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: !status.length ? `Your order not placed yet!` : `order is ${status[0].status}`
                })
            );
        }

        let driverInfo;
        if (status[0].status === 'placed' || status[0].status === 'packed' || status[0].status === 'shipped') {
            driverInfo = {
                'name': 'Kunal Agrawal',
                'contact_number': '+91 9924499244'
            }
        }

        const [statusDetail] = await trackOrder(orderId);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                data: {
                    status: statusDetail[0],
                    driverDetails: driverInfo
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

exports.cancelOrder = async (req, res, next) => {
    try {
        const { orderId, reason } = req.body;
        const [status] = await getOrderStatus(orderId);
        if (!status.length || status[0].status === 'shipped' || status[0].status === 'delivered') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: !status.length ? `Your order not placed yet!` : `Your order is ` + (status[0].status === 'shipped' ? `` : `in `) + `${status[0].status}, you can't cancel it.`
                })
            );
        }

        await cancelOrder(orderId, reason);
        await updateOrderStatus(orderId, 'cancel');
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: "Your order is canceled successfully."
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