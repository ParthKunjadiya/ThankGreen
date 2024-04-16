const express = require('express');

const userController = require('../controllers/user');
const { isAuth } = require('../middleware/is-auth');
const { upload } = require('../uploads/multer');

const router = express.Router();

router.get('/info', isAuth, userController.getInfo);

router.put(
    '/info',
    isAuth,
    upload.fields([
        { name: "profileImage", maxCount: 1 }
    ]),
    userController.updateInfo
);

router.get('/address', isAuth, userController.address);

router.post('/add-address', isAuth, userController.addAddress);

router.put('/update-address/:addressId', isAuth, userController.updateAddress);

router.delete('/delete-address/:addressId', isAuth, userController.deleteAddress);

router.get('/card', isAuth, userController.card);

router.post('/add-card', isAuth, userController.addCard);

router.put('/update-card/:cardId', isAuth, userController.updateCard);

router.delete('/delete-card/:cardId', isAuth, userController.deleteCard);

module.exports = router;