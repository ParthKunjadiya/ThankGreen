const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const OTPLessAuth = require('otpless-node-js-auth-sdk');
const { generateResponse, sendHttpResponse } = require("../helper/response");
const { uploader } = require('../uploads/uploader');

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../util/jwtToken');

const {
    insertUser,
    getUserData,
    updateUserProfileImage,
    updateUserPassword,
    setResetTokenToUser,
    updatePasswordAndToken
} = require('../repository/user');

const {
    loginSchema,
    signupSchema,
    changePasswordSchema,
    resetPasswordSchema,
    postResetPasswordSchema
} = require('../validator/ProductValidationSchema');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.signup = async (req, res, next) => {
    const { error } = signupSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const { email, countryCode, phoneNumber } = req.body;
    try {
        const [userEmailResult] = await getUserData({ email })
        const [userPhoneNumberResult] = await getUserData({ country_code: countryCode, phone_number: phoneNumber })
        if (userEmailResult.length || userPhoneNumberResult.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: (userEmailResult.length ? 'A user with this email Already Exists.' : '') + (userPhoneNumberResult.length ? 'A user with this phone number Already Exists.' : ''),
                })
            );
        }

        const internationalPhoneNumber = countryCode + phoneNumber;
        const response = await OTPLessAuth.sendOTP(internationalPhoneNumber, '', process.env.OTPLESS_CHANNEL, '', '', process.env.OTPLESS_EXPIRY, process.env.OTPLESS_OTP_LENGTH, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        console.log(response)
        if (response.success === false) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'otp generation failed!, ' + response.errorMessage,
                })
            );
        }
        const otpId = response.orderId;
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'otp send successfully to ' + internationalPhoneNumber,
                data: {
                    otpId: otpId
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.login = async (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { phoneNumber, email, password } = req.body;
    let isEmail = email !== undefined;
    try {
        const [user] = await getUserData(isEmail ? { email } : { phone_number: phoneNumber })
        if (!user.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'A user with this ' + isEmail ? 'email' : 'phone number' + ' could not be found.'
                })
            );
        }
        const isEqual = await bcrypt.compare(password, user[0].password);
        if (!isEqual) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Wrong password!',
                })
            );
        }
        const accessToken = generateAccessToken(user[0].id)
        const refreshToken = generateRefreshToken(user[0].id)
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Login successful',
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.resendOtp = async (req, res, next) => {
    const { otpId } = req.body;
    try {
        const response = await OTPLessAuth.resendOTP(otpId, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        if (response.success === false) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: response.errorMessage,
                })
            );
        }
        const newOtpId = response.orderId;
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'resend otp successful.',
                data: {
                    otpId: newOtpId
                }
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.verifyMasterOtp = async (req, res, next) => {
    const { profileImageUrl, name, email, countryCode, phoneNumber, password, otp, otpId } = req.body;
    try {
        if (otp !== '1234' && otpId !== 'Otp_CEC413FCC6F9432AB5A33AD19E74DF10') {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Invalid otp or otpId!',
                })
            );
        }
        const result = await insertUser(profileImageUrl, name, email, password, countryCode, phoneNumber);
        if (!result) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Try again',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'otp Verified'
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.verifyOtp = async (req, res, next) => {
    try {
        const { name, email, countryCode, phoneNumber, password, otp, otpId } = req.body;
        let profileImage = null;
        if (req.files && req.files.profileImage) {
            profileImage = req.files.profileImage[0].path;
        }
        const internationalPhoneNumber = countryCode + phoneNumber;
        const response = await OTPLessAuth.verifyOTP('', internationalPhoneNumber, otpId, otp, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);
        if (response.success === false) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: response.errorMessage,
                })
            );
        }
        if (response.isOTPVerified === true) {
            const hashedPassword = await bcrypt.hash(password, 10)
            const [result] = await insertUser(name, email, hashedPassword, countryCode, phoneNumber);
            if (!result) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 401,
                        msg: 'Internal server error, Try again',
                    })
                );
            }
            const userId = result.insertId;

            // ------ Image uploading ------
            if (userId && profileImage) {
                let imageResult = await uploader(profileImage);
                const [profileImageUrl = null] = imageResult ?? [];

                if (profileImageUrl) {
                    await updateUserProfileImage({ userId, profileImageUrl });
                }
            }
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 201,
                    msg: 'otp Verified'
                })
            );
        } else {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    statusCode: 404,
                    status: "error",
                    msg: response.reason ? response.reason : "entered otp is wrong, please try again",
                })
            );
        }
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.generateNewAccessToken = async (req, res, next) => {
    const { refreshToken } = req.body;
    try {
        const { status, statusCode, msg, data } = verifyRefreshToken(refreshToken)
        if (status === "error" && (statusCode === 401 || statusCode === 403)) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: status,
                    statusCode: statusCode,
                    msg: msg,
                })
            );
        }
        if (status === "success" && statusCode === 200) {
            const accessToken = generateAccessToken(data.userId);
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Access token created successfully',
                    data: {
                        accessToken: accessToken
                    }
                })
            );
        }
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.changePassword = async (req, res, next) => {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { oldPassword, newPassword } = req.body;
    try {
        const [user] = await getUserData({ id: req.userId })
        if (!user.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'User not logged In, try again.',
                })
            );
        }
        const hashedOldPassword = user[0].password;
        const passwordMatch = await bcrypt.compare(oldPassword, hashedOldPassword);
        if (!passwordMatch) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Old password is incorrect!',
                })
            );
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        const [result] = await updateUserPassword(req.userId, hashedNewPassword)
        if (!result.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, change password failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'password changed successfully.'
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.resetPasswordLink = (req, res, next) => {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const { email } = req.body;
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 400,
                        msg: 'Internal server error, Reset password failed!',
                    })
                );
            }
            const resetToken = buffer.toString('hex');
            const [user] = await getUserData({ email })
            if (!user.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 400,
                        msg: 'A user with this email could not be found.',
                    })
                );
            }
            const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
            const setResetToken = await setResetTokenToUser(email, resetToken, resetTokenExpiry)
            if (!setResetToken[0].affectedRows) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 400,
                        msg: 'Internal server error, Reset password failed!',
                    })
                );
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
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "success",
                    statusCode: 200,
                    msg: 'Reset password request successful.'
                })
            );
        })
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    };
}

exports.resetPassword = async (req, res, next) => {
    const { error } = postResetPasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;
        const [user] = await getUserData({ resetToken });
        if (!user.length) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid or expired token!',
                })
            );
        }
        const currentTime = new Date();
        if (user[0].resetTokenExpiry && currentTime > new Date(user.resetTokenExpiry)) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 404,
                    msg: 'Invalid or expired token!',
                })
            );
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const result = await updatePasswordAndToken(hashedNewPassword, user[0].id);
        if (!result) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, password not reset!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Password reset successfully.'
            })
        );
    } catch (err) {
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}