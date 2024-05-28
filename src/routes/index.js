const express = require('express');

const authRoutes = require('./auth');
const homeRoutes = require('./home');
const userRoutes = require('./user');
const productRoutes = require('./products');
const orderRoutes = require('./order');

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/home', homeRoutes);
router.use('/api/userprofile', userRoutes);
router.use('/api/shop', productRoutes);
router.use('/api', orderRoutes);

module.exports = router;