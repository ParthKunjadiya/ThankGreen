require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require("passport");
const { useGoogleStrategy } = require('./src/util/passport');
const session = require("express-session");
const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

useGoogleStrategy();
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

const indexRoutes = require('./src/routes/index');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
    verify: function (req, res, buf) {
        var url = req.originalUrl;
        if (url.startsWith('/api/stripe/webhook')) {
            req.rawBody = buf.toString()
        }
    }
}));

app.use(indexRoutes);

app.listen(process.env.PORT);