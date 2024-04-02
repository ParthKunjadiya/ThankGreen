const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            // .custom((value, { req }) => {
            //     return User.findOne({ email: value }).then(userDoc => {
            //         if (userDoc) {
            //             return Promise.reject('E-Mail address already exists!');
            //         }
            //     })
            // })
            .normalizeEmail(),
        body('phoneNumber')
            .isLength({ min: 10, max: 10 })
            .withMessage('Enter valid phone number'),
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

module.exports = router;