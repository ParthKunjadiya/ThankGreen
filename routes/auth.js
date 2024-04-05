const express = require('express');

const authController = require('../controllers/auth');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/resend-otp', authController.resendOtp);

router.post('/verify-otp', authController.verifyOtp);

router.put('/change-password', isAuth, authController.changePassword);

router.patch('/reset-password', authController.resetPasswordLink);

router.put('/reset-password/:resetToken', authController.resetPassword)

module.exports = router;