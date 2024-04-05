const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const OTPLessAuth = require('otpless-node-js-auth-sdk');
require("dotenv").config();

const {
    insertUser,
    getUserData,
    updateUserPassword,
    setResetTokenToUser,
    updatePasswordAndToken
} = require('../repository/user');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

function generateJWT(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

exports.signup = async (req, res, next) => {
    let profileImageUrl;
    if (req.file) {
        profileImageUrl = req.file.path;
    }
    const { name, email, countryCode, phoneNumber, password } = req.body;

    try {
        const internationalPhoneNumber = countryCode + phoneNumber;
        const response = await OTPLessAuth.sendOTP(internationalPhoneNumber, '', process.env.OTPLESS_CHANNEL, '', '', process.env.OTPLESS_EXPIRY, process.env.OTPLESS_OTP_LENGTH, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        if (response.success === false) {
            const error = new Error('otp generation failed!, ' + response.errorMessage);
            error.statusCode = 400;
            throw error;
        }
        const otpId = response.orderId;

        const hashedPassword = await bcrypt.hash(password, 10)
        res.status(201).json({
            message: 'otp send successfully to ' + internationalPhoneNumber,
            data: {
                profileImageUrl: profileImageUrl,
                name: name,
                email: email,
                countryCode: countryCode,
                phoneNumber: phoneNumber,
                password: hashedPassword,
                otpId: otpId
            }
        });

        mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Signup Succeeded',
            html: '<h1>You Successfully signed up!</h1>'
        };
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(err);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.login = async (req, res, next) => {
    const { phoneNumber, email, password } = req.body;
    let isEmail = email !== undefined;
    try {
        const [user] = await getUserData(isEmail ? { email } : { phone_number: phoneNumber })
        if (!user.length) {
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 400;
            throw error;
        }
        const isEqual = await bcrypt.compare(password, user[0].password);
        if (!isEqual) {
            const error = new Error('Wrong password!');
            error.statusCode = 400;
            throw error;
        }
        const token = generateJWT(user[0].id)
        res.status(200).json({
            message: 'Login successful', token: token
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.resendOtp = async (req, res, next) => {
    const { otpId } = req.body;
    try {
        const response = await OTPLessAuth.resendOTP(otpId, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        if (response.success === false) {
            const error = new Error(response.errorMessage);
            error.statusCode = 400;
            throw error;
        }
        const newOtpId = response.orderId;
        res.status(200).json({ message: 'resend otp successful.', data: { otpId: newOtpId } });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.verifyOtp = async (req, res, next) => {
    const { profileImageUrl, name, email, countryCode, phoneNumber, password, otp, otpId } = req.body;
    try {
        const internationalPhoneNumber = countryCode + phoneNumber;
        const response = await OTPLessAuth.verifyOTP('', internationalPhoneNumber, otpId, otp, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        if (response.success === false) {
            const error = new Error('Invalid otp, ' + response.errorMessage);
            error.statusCode = 400;
            throw error;
        }
        if (response.isOTPVerified === true) {
            const result = await insertUser(profileImageUrl, name, email, password, countryCode, phoneNumber);
            if (!result) {
                const error = new Error('Signup failed!');
                error.statusCode = 401;
                throw error;
            }
            res.status(200).json({ message: 'otp Verified' });
        }
        res.status(200).json({ message: 'Invalid otp!' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const [user] = await getUserData({ id: req.userId })
        if (!user.length) {
            const error = new Error('Login again!');
            error.statusCode = 401;
            throw error;
        }
        const hashedOldPassword = user[0].password;
        const passwordMatch = await bcrypt.compare(oldPassword, hashedOldPassword);
        if (!passwordMatch) {
            const error = new Error('Old password is incorrect!');
            error.statusCode = 401;
            throw error;
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        const [result] = await updateUserPassword(req.userId, hashedNewPassword)
        if (!result.affectedRows) {
            const error = new Error('change password failed!!');
            error.statusCode = 400;
            throw error;
        }
        res.status(200).json({ message: 'password changed successfully.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.resetPasswordLink = (req, res, next) => {
    try {
        const { email } = req.body;
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                const error = new Error('reset Password token generation failed!');
                error.statusCode = 400;
                throw error;
            }
            const resetToken = buffer.toString('hex');
            const [user] = await getUserData({ email })
            if (!user.length) {
                const error = new Error('A user with this email could not be found!');
                error.statusCode = 401;
                throw error;
            }
            const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
            const setResetToken = await setResetTokenToUser(email, resetToken, resetTokenExpiry)
            if (!setResetToken[0].affectedRows) {
                const error = new Error('reset password failed!!');
                error.statusCode = 400;
                throw error;
            }

            mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Reset Password',
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/api/auth/reset/${resetToken}">Link</a> to set a new password.</p>
                `
            };
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.status(200).json({ message: 'Reset password request successful.' });
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;
        const [user] = await getUserData({ resetToken });
        if (!user.length) {
            const error = new Error('Invalid or expired token!');
            error.statusCode = 404;
            throw error;
        }
        const currentTime = new Date();
        if (user[0].resetTokenExpiry && currentTime > new Date(user.resetTokenExpiry)) {
            const error = new Error('Invalid or expired token!');
            error.statusCode = 404;
            throw error;
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const result = await updatePasswordAndToken(hashedNewPassword, user[0].id);
        if (!result) {
            const error = new Error('Password not reset, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Password reset successfully.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}