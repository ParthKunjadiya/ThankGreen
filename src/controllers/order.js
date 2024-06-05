const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const uuid = require('uuid');

const {
    sendNotification,
} = require('../controllers/notification');

const {
    getCurrentOrders,
    getCurrentOrderCount,
    getPastOrders,
    getPastOrderCount,
    getOrderByOrderId,
    getOrderCount,
    getProductQuantityDetail,
    addOrderAddressDetail,
    addOrderDetail,
    addOrderItemDetail,
    addOrderStatusDetail,
    addPaymentDetail,
    getPaymentDetails,
    getOrderStatus,
    updateOrderStatus,
    updatePaymentDetails,
    addRating,
    trackOrder,
    cancelOrder,
    reportIssue,
    countOrdersByUserId,
    findUserById,
    findReferralByCode,
    updateReferralBonus,
    getReferralAmount,
    deductReferralAmount
} = require('../repository/order');

const {
    getCouponByCouponId
} = require('../repository/coupons');

const {
    getAddress
} = require('../repository/address');

const {
    getUserData,
    getDeviceToken
} = require('../repository/user');

const {
    updateOrderNotification
} = require('../repository/notification');

const {
    orderSchema
} = require("../validator/orderValidationSchema");

const { generateResponse, sendHttpResponse } = require("../helper/response");

function generateInvoiceNumber() {
    return uuid.v4(); // Generates a version 4 UUID
}

const isApplicable = async (couponId, order_total, orderCount) => {
    const [couponDetail] = await getCouponByCouponId(couponId)
    const { min_price, valid_on_order_number, start_date, expiry_date } = couponDetail[0]

    const currentDate = new Date();
    if (!(currentDate >= start_date && currentDate <= expiry_date)) {
        return 0
    }
    if (order_total < min_price) {
        return 0
    }
    if (orderCount > valid_on_order_number) {
        return 0
    }
    return 1
}

exports.getOrders = async (req, res, next) => {
    try {
        const currentOrderPage = parseInt(req.query.currentOrderPage) || 1;
        const currentOrderLimit = 10;
        const currentOrderOffset = (currentOrderPage - 1) * currentOrderLimit;

        const pastOrderPage = parseInt(req.query.pastOrderPage) || 1;
        const pastOrderLimit = 10;
        const pastOrderOffset = (pastOrderPage - 1) * pastOrderLimit;

        const [currentOrders] = await getCurrentOrders({ userId: req.userId, currentOrderOffset, currentOrderLimit })
        const [currentOrdersCount] = await getCurrentOrderCount({ userId: req.userId })

        const [pastOrders] = await getPastOrders({ userId: req.userId, pastOrderOffset, pastOrderLimit })
        const [pastOrdersCount] = await getPastOrderCount({ userId: req.userId })

        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Orders fetched!',
                data: {
                    currentOrders: currentOrders.length ? currentOrders : `No current orders found`,
                    total_current_orders: currentOrdersCount.length,
                    pastOrders: pastOrders.length ? pastOrders : `No past orders found`,
                    total_past_orders: pastOrdersCount.length,
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

exports.getOrderSummary = async (req, res, next) => {
    try {
        const { products, couponId } = req.query;
        let parsedProducts;
        try {
            parsedProducts = products ? JSON.parse(products) : undefined;
        } catch (error) {
            console.error('Error parsing filters: ', error);
        }

        if (!parsedProducts || !parsedProducts.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: `For order summary one product required in cart.`
                })
            );
        }

        let remaining_reward;
        if (req.userId) {
            const userId = req.userId;
            const [referralResults] = await getReferralAmount(userId);
            remaining_reward = referralResults.length > 0 ? referralResults[0].remaining_reward : 0;
            remaining_reward = parseFloat(remaining_reward);
        }

        let order_sub_total = 0;
        let ProductQuantity;
        await Promise.all(
            parsedProducts.map(async (product) => {
                [ProductQuantity] = await getProductQuantityDetail({ id: product.productQuantity_id, product_id: product.id });
                order_sub_total += parseFloat(product.quantity) * parseFloat(ProductQuantity[0].price)
            })
        );
        order_sub_total = order_sub_total.toFixed(2);

        let deliveryCharge = order_sub_total > 599 ? 0 : (order_sub_total * 0.02).toFixed(2)
        let discountAmount = 0;
        if (couponId) {
            if (!req.userId) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "User must be logIn for applying coupon",
                    })
                );
            }
            const [coupon] = await getCouponByCouponId(couponId);
            if (!coupon.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "Coupon not found!",
                    })
                );
            }
            const { discount_type, discount_value, max_discount } = coupon[0];
            let [orderCount] = await getOrderCount({ user_id: req.userId })
            let is_valid = await isApplicable(couponId, order_sub_total, orderCount)
            if (!is_valid) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "COUPON IS NOT APPLICABLE, PLEASE REFER TO THE TERMS AND CONDITIONS FOR MORE DETAILS.",
                    })
                );
            }

            if (discount_type === 'fixed') {
                discountAmount = discount_value
            } else if (discount_type === 'rate') {
                const rated_discount = (order_sub_total * discount_value) / 100
                discountAmount = rated_discount > max_discount ? max_discount : rated_discount
            }
        }

        let order_total = (parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discountAmount)).toFixed(2);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Order summary',
                data: {
                    sub_total: order_sub_total,
                    delivery_charges: deliveryCharge,
                    discount_amount: discountAmount.toFixed(2),
                    referral_bonus: remaining_reward ? remaining_reward.toFixed(2) : undefined,
                    total: order_total
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

exports.postOrder = async (req, res, next) => {
    try {
        const { error } = orderSchema.validate(req.body);
        if (error) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: error.details[0].message
                })
            );
        }

        const { address_id, coupon_id, products, delivery_on, payment_method, use_referral_bonus } = req.body;
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
        let deliveryCharge = order_sub_total > 599 ? 0 : (order_sub_total * 0.05).toFixed(2)

        let discountAmount = 0;
        if (coupon_id) {
            const [coupon] = await getCouponByCouponId(coupon_id);
            if (!coupon.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "Coupon not found!",
                    })
                );
            }
            const { discount_type, discount_value, max_discount } = coupon[0];
            let [orderCount] = await getOrderCount({ user_id: req.userId })
            let is_valid = await isApplicable(coupon_id, order_sub_total, orderCount)
            if (!is_valid) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 200,
                        msg: "COUPON IS NOT APPLICABLE, PLEASE REFER TO THE TERMS AND CONDITIONS FOR MORE DETAILS.",
                    })
                );
            }

            if (discount_type === 'fixed') {
                discountAmount = discount_value
            } else if (discount_type === 'rate') {
                const rated_discount = (order_sub_total * discount_value) / 100
                discountAmount = rated_discount > max_discount ? max_discount : rated_discount
            }
        }
        discountAmount = discountAmount.toFixed(2)

        let order_total = (parseFloat(order_sub_total) + parseFloat(deliveryCharge) - parseFloat(discountAmount)).toFixed(2);

        let remaining_reward;
        let userId = req.userId;
        if (use_referral_bonus) {
            const [referralResults] = await getReferralAmount(userId);
            remaining_reward = referralResults.length > 0 ? referralResults[0].remaining_reward : 0;
            remaining_reward = parseFloat(remaining_reward);

            if (remaining_reward > 0) {
                if (order_total <= remaining_reward) {
                    remaining_reward = order_total;
                    order_total = 0;
                } else {
                    order_total -= remaining_reward;
                }

                // Update the referral amount in the database
                await deductReferralAmount(userId, remaining_reward);
            } else {
                remaining_reward = 0;
            }
        }

        // add orderAddress details in database
        const [addressDetail] = await getAddress({ user_id: req.userId, id: address_id })
        const [addOrderAddress] = await addOrderAddressDetail(addressDetail[0])
        let order_address_id = addOrderAddress.insertId

        // add order in database
        const [order] = await addOrderDetail({ user_id: req.userId, coupon_id, address_id: order_address_id, gross_amount: order_sub_total, discount_amount: discountAmount, delivery_charge: deliveryCharge, referral_bonus_used: remaining_reward, order_amount: order_total, delivery_on })
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
        if (payment_method === 'card') {
            const amountInPaisa = Math.round(order_total * 100);
            const paymentIntentData = {
                payment_method_types: ['card'],
                amount: amountInPaisa,
                currency: 'inr',
                description: 'Order payment',
                metadata: { orderId },
                shipping: {
                    name: 'shipping',
                    address: {
                        line1: addressDetail[0].address,
                        line2: addressDetail[0].landmark,
                        city: addressDetail[0].city,
                        state: addressDetail[0].state,
                        postal_code: addressDetail[0].zip_code,
                        country: 'IN',
                    },
                }
            };
            paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
        }

        const [paymentDetail] = await addPaymentDetail({ order_id: orderId, type: payment_method === 'card' ? 'card' : 'COD', status: 'unpaid' });
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
                    paymentIntent_id: paymentIntent ? paymentIntent.id : undefined,
                    paymentIntent_client_secret: payment_method === 'card' ? paymentIntent.client_secret : undefined
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
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_END_POINT_SECRET;
    let event, orderId, invoiceNumber, paymentDetail;
    try {
        try {
            event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed.', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: { event_received: true }
            })
        );

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                orderId = paymentIntentSucceeded.metadata.orderId;

                [paymentDetail] = await getPaymentDetails(orderId);
                invoiceNumber = paymentDetail[0].invoice_number
                if (paymentDetail[0].status !== paymentIntentSucceeded.status) {
                    invoiceNumber = generateInvoiceNumber();
                }

                // Payment succeeded, update order status to 'placed'
                await updateOrderStatus(orderId, 'placed');
                // Update the payment details table with the payment status
                await updatePaymentDetails(orderId, invoiceNumber, paymentIntentSucceeded.status);


                const userId = paymentDetail[0].user_id;
                const [deviceTokens] = await getDeviceToken(userId);
                const [orderDetail] = await getOrderByOrderId({ userId, orderId })
                if (deviceTokens.length) {
                    const notificationBody = 'Your order delivered on ' + orderDetail.delivery_on;
                    await updateOrderNotification(userId, notificationBody)
                    deviceTokens.map(async (deviceToken) => {
                        const response = await sendNotification(deviceToken.device_token, notificationBody);
                        console.log(response.status, response.statusText, response.data)
                    });
                }

                const [orderCountResult] = await countOrdersByUserId(userId);
                const orderCount = orderCountResult[0].count;

                if (orderCount === 1) {
                    const [userResult] = await findUserById(userId);
                    const referralCode = userResult[0].referral_with;

                    if (referralCode) {
                        const [referralResults] = await findReferralByCode(referralCode);
                        if (referralResults.length > 0) {
                            const referrerId = referralResults[0].user_id;
                            await updateReferralBonus(referrerId, 2);
                        }
                    }
                }
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
                orderId = paymentIntentPaymentFailed.metadata.orderId;

                [paymentDetail] = await getPaymentDetails(orderId);
                invoiceNumber = paymentDetail[0].invoice_number
                if (paymentDetail[0].status !== paymentIntentPaymentFailed.status) {
                    invoiceNumber = generateInvoiceNumber();
                }

                // Payment failed, update order status to 'cancel'
                await updateOrderStatus(orderId, 'cancel');
                // Update the payment details table with the payment status
                await updatePaymentDetails(orderId, invoiceNumber, paymentIntentPaymentFailed.status);
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

exports.reportIssue = async (req, res, next) => {
    try {
        const { orderId, issue } = req.body;
        const [status] = await getOrderStatus(orderId);
        if (!status.length || status[0].status !== 'delivered') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: !status.length ? `Your order not placed yet!` : `Your order is not delivered, you can't report it.`
                })
            );
        }

        await reportIssue(orderId, issue);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: "Your order issue reported successfully."
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