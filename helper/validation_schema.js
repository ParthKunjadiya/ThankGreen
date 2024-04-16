const Joi = require("joi");

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase(),
    phoneNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .messages({ 'string.pattern.base': 'Phone number must contain only digits.' }),
    password: Joi.string()
        .trim()
        .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
        .required()
        .messages({ 'string.pattern.base': 'password not contain any special character.' })
});

const signupSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase(),
    countryCode: Joi.string()
        .regex(/^\+\d+$/)
        .messages({ 'string.pattern.base': 'Country code must start with + followed by digits.' }),
    phoneNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .messages({ 'string.pattern.base': 'Phone number must contain only digits.' }),
    password: Joi.string()
        .trim()
        .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
        .required()
        .messages({ 'string.pattern.base': 'password not contain any special character.' }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({ 'any.only': 'Passwords have to match!' })
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .trim()
        .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
        .required()
        .messages({ 'string.pattern.base': 'password not contain any special character.' }),
    newPassword: Joi.string()
        .trim()
        .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
        .required()
        .messages({ 'string.pattern.base': 'password not contain any special character.' }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({ 'any.only': 'Passwords have to match!' })
});

const resetPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase()
        .required()
});

const postResetPasswordSchema = Joi.object({
    newPassword: Joi.string()
        .trim()
        .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
        .required()
        .messages({ 'string.pattern.base': 'password not contain any special character.' })
});

module.exports = {
    loginSchema,
    signupSchema,
    changePasswordSchema,
    resetPasswordSchema,
    postResetPasswordSchema
};