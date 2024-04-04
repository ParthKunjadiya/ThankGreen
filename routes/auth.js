const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const { getUserData } = require('../repository/user');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom(async (value, { req }) => {
                const result = await getUserData({ email: value })
                if (result[0].length) {
                    return Promise.reject('E-Mail address already exists!');
                }
            })
            .normalizeEmail(),
        body('phoneNumber')
            .isLength({ min: 10, max: 10 })
            .withMessage('Phone number must be exactly 10 characters long.')
            .custom(async (value, { req }) => {
                const result = await getUserData({ phone_number: value })
                if (result[0].length) {
                    return Promise.reject('Phone number already exists!');
                }
            }),
        body('password', 'please enter a password at least 8 characters long.')
            .trim()
            .isLength({ min: 8 }),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match!');
                }
                return true;
            }),
        body('name')
            .trim()
            .not()
            .isEmpty()
    ],
    authController.signup
);

router.post(
    '/login',
    [
        body('password', 'please enter a password at least 8 characters long.')
            .trim()
            .isLength({ min: 8 })
    ],
    authController.login
);

router.post('/resend-otp',authController.resendOtp);

router.post(
    '/verify-otp',
    [
        body('otp')
            .isLength({ min: 4, max: 4 })
            .withMessage('OTP must be exactly 4 characters long.')
    ],
    authController.verifyOtp
);

router.put(
    '/change-password',
    isAuth,
    [
        body('oldPassword')
            .trim()
            .isLength({ min: 8 })
            .withMessage('please enter a password at least 8 characters long.'),
        body('newPassword')
            .trim()
            .isLength({ min: 8 })
            .withMessage('please enter a password at least 8 characters long.')
            .custom((value, { req }) => {
                if (value === req.body.oldPassword) {
                    throw new Error('old Password And new Password can not same!');
                }
                return true;
            }),
        body('confirmNewPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Re-entered new passwords have to match!');
                }
                return true;
            }),
    ],
    authController.changePassword
);

router.patch('/reset-password', authController.resetPasswordLink);

router.put('/reset-password/:resetToken', authController.resetPassword)

module.exports = router;