const express = require('express');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/order');

require('dotenv').config();
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/userprofile', userRoutes);
app.use('/api/shop', productRoutes);
app.use('/api', orderRoutes);

app.listen(process.env.PORT);