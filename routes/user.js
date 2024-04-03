const express = require('express');

const userController = require('../controllers/user');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/info', isAuth, userController.getInfo);

router.put('/info', isAuth, userController.updateInfo);

module.exports = router;