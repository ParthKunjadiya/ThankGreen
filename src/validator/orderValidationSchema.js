const Joi = require("joi");

const productSchema = Joi.object({
    id: Joi.number().integer().min(1).required(),
    quantity: Joi.number().integer().min(1).max(10).required(),
    productQuantity_id: Joi.number().integer().min(1).required()
});

const orderSchema = Joi.object({
    address_id: Joi.number().required(),
    coupon_id: Joi.number().optional(),
    products: Joi.array().items(productSchema).min(1).required(),
    delivery_on: Joi.string().required(),
    payment_method: Joi.string().valid('card', 'COD').required(),
    use_referral_bonus: Joi.boolean().required(),
})

module.exports = {
    orderSchema
}