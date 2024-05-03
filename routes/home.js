const express = require('express');

const homeController = require('../controllers/home');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, homeController.home);

module.exports = router;