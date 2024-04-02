const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const name = req.body.name;
    const email = req.body.email;
    const countryCode = req.body.countryCode;
    const phoneNumber = req.body.phoneNumber;
    const password = req.body.password;

    try {
        const hashedPw = await bcrypt.hash(password, 12)
        const user = new User(name, email, hashedPw, countryCode, phoneNumber);
        const result = await user.save();
        res.status(201).json({
            message: 'User created!',
            data: result
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
        user = await User.find(isEmail ? { email: email } : { phone_number: phoneNumber })
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
                email: loadedUser[0][0].email,
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