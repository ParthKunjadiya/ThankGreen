const express = require('express');

const authController = require('../controllers/auth');
const { isAuth } = require('../middleware/isAuth');
const { upload } = require('../uploads/multer');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/generate-access-token', authController.generateNewAccessToken);

router.post('/resend-otp', authController.resendOtp);

router.post(
    '/verify-otp',
    upload.fields([
        { name: "profileImage", maxCount: 1 }
    ]),
    authController.verifyOtp
);

router.put('/change-password', isAuth, authController.changePassword);

router.patch('/reset-password', authController.resetPasswordLink);

router.put('/reset-password/:resetToken', authController.resetPassword)

module.exports = router;