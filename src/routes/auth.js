const express = require('express');

const passport = require("passport");
const authController = require('../controllers/auth');
const { isAuth } = require('../middleware/isAuth');
const { upload } = require('../uploads/multer');

const router = express.Router();

router.get(
    "/google",
    passport.authenticate("google", {
        session: true,
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { session: true }),
    authController.loginOrRegisterWithGoogle
);

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.post('/store-device-token', isAuth, authController.storeDeviceToken);

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

router.put('/reset-password/:resetToken', authController.resetPassword);

router.get('/reset-redirect/:token', authController.resetRedirect);

module.exports = router;