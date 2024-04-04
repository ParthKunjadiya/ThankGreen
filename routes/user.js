const express = require('express');

const userController = require('../controllers/user');
const { isAuth } = require('../middleware/is-auth');

const router = express.Router();

router.get('/info', isAuth, userController.getInfo);

router.put('/info', isAuth, userController.updateInfo);

router.get('/address', isAuth, userController.address);

// router.post('/address', isAuth, userController.addAddress);

// router.put('/address', isAuth, userController.updateAddress);

// router.delete('/address', isAuth, userController.deleteAddress);

module.exports = router;