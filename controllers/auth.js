const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/user');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'parthkunjadiya3@gmail.com',
        pass: 'yref eybc ytxv dksf'
    }
});

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const profileImageUrl = req.file.path;
    const name = req.body.name;
    const email = req.body.email;
    const countryCode = req.body.countryCode;
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;

    try {
        const hashedPw = await bcrypt.hash(password, 12)
        const user = new User(profileImageUrl, name, email, hashedPw, countryCode, phoneNumber);
        const result = await user.save();
        res.status(201).json({
            message: 'User created!',
            data: result
        });

        mailOptions = {
            from: 'parthkunjadiya3@gmail.com',
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const phoneNumber = req.body.phoneNumber;
    const email = req.body.email;
    const password = req.body.password;
    let isEmail = email !== undefined;
    let user;
    let loadedUser;
    try {
        user = await User.find(isEmail ? { email: email, is_verify: 1 } : { phone_number: phoneNumber, is_verify: 1 })
        if (!user[0].length) {
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 401; //401 status code for not authenticated
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user[0][0].password);
        if (!isEqual) {
            const error = new Error('Wrong password!');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign(
            {
                userId: loadedUser[0][0].id
            },
            'someSecretKey',
            { expiresIn: '1h' }
        );
        res.status(200).json({ token: token, userId: loadedUser[0][0].id });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.otp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const otp = req.body.otp;
    try {
        if (otp !== '1234') {
            const error = new Error('otp is invalid!');
            error.statusCode = 401;
            throw error;
        }
        // const isVerify = await User.isVerify(req.userId)
        // if (!isVerify) {
        //     const error = new Error('A user with this email could not be found.');
        //     error.statusCode = 401; //401 status code for not authenticated
        //     throw error;
        // }
        res.status(200).json({ message: 'otp Verified' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.changePassword = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = 'parthkunjadiya3@gmail.com';
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    let loadedUser;
    try {
        const user = await User.find({ email: email, is_verify: 1 })
        if (!user[0].length) {
            const error = new Error('Login again!');
            error.statusCode = 401; //401 status code for not authenticated
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(oldPassword, user[0][0].password);
        if (!isEqual) {
            const error = new Error('Old password is incorrect!');
            error.statusCode = 401;
            throw error;
        }
        const newHashedPassword = await bcrypt.hash(newPassword, 12)
        const result = await User.updatePassword(email, newHashedPassword)
        if (!result[0].affectedRows) {
            const error = new Error('change password failed!!');
            error.statusCode = 401; //401 status code for not authenticated
            throw error;
        }
        res.status(200).json({ message: 'change password successful.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.resetPassword = (req, res, next) => {
    crypto.randomBytes(32, async (err, buffer) => {
        if (err) {
            const error = new Error('reset Password failed!');
            error.statusCode = 401;
            throw error;
        }
        const email = req.body.email;
        try {
            const token = buffer.toString('hex');
            const user = await User.find({ email: email })
            if (!user) {
                const error = new Error('A user with this email could not be found!');
                error.statusCode = 401;
                throw error;
            }
            const resetToken = token;
            const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' ');
            const setResetToken = await User.setResetToken(email, resetToken, resetTokenExpiry)
            if (!setResetToken[0].affectedRows) {
                const error = new Error('reset password failed!!');
                error.statusCode = 401; //401 status code for not authenticated
                throw error;
            }
            res.status(200).json({ message: 'Reset password request successful.' });
            mailOptions = {
                from: 'parthkunjadiya3@gmail.com',
                to: email,
                subject: 'Reset Password',
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/api/auth/reset/${token}">Link</a> to set a new password.</p>
                `
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
    });
}