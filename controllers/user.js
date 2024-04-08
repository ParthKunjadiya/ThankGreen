const cloudinary = require('cloudinary').v2;

const {
    getUserData,
    updateUserProfileImage,
    updateUserData
} = require('../repository/user');

const {
    insertAddress,
    getAddress,
    updateAddress,
    deleteAddress
} = require('../repository/address');

const {
    insertCard,
    getCard,
    updateCard,
    deleteCard
} = require('../repository/card');

exports.getInfo = async (req, res, next) => {
    try {
        const [data] = await getUserData({ id: req.userId })
        if (!data) {
            const error = new Error('some error occurred to get personal information!!');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({
            message: 'Information fetched!',
            data: data.map(data => ({
                profileImageUrl: data.profileImageUrl,
                name: data.name,
                email: data.email,
                phone_number: data.country_code + data.phone_number
            }))
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updateInfo = async (req, res, next) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //     const error = new Error('Validation failed.');
    //     error.statusCode = 422;
    //     error.data = errors.array();
    //     throw error;
    // }

    let name, email, phoneNumber, profileImageUrl, isImageUrl;
    if (req.body.name !== undefined && req.body.email !== undefined && req.body.phoneNumber !== undefined) {
        isImageUrl = false;
        name = req.body.name;
        email = req.body.email;
        phoneNumber = req.body.phoneNumber;
    } else if (req.file) {
        isImageUrl = true;
        profileImageUrl = req.file.path;
        if (!profileImageUrl) {
            const error = new Error('No file picked.');
            error.statusCode = 422;
            throw error;
        }
    }
    let updated;
    try {
        if (isImageUrl) {
            const [userData] = await getUserData({ id: req.userId });
            if (!userData.length) {
                const error = new Error('A user with this email could not be found.');
                error.statusCode = 400;
                throw error;
            }
            if (profileImageUrl !== userData[0].profileImageUrl) {
                const url = userData[0].profileImageUrl;
                const parts = url.split('/');
                const publicIdWithExtension = parts.slice(-2).join('/');
                const publicId = publicIdWithExtension.split('.').slice(0, -1).join('.');
                cloudinary.api.delete_resources([publicId], { type: 'upload', resource_type: 'image' })
                    .then(console.log('deleted old profile image'));
            }
            [updated] = await updateUserProfileImage({ userId: req.userId, profileImageUrl })
        } else {
            [updated] = await updateUserData({ userId: req.userId, name, email, phone_number: phoneNumber })
        }
        if (!updated.affectedRows) {
            const error = new Error('User update failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(isImageUrl ? { message: 'User profile image updated successfully.' } : { message: 'User detail updated successfully.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.address = async (req, res, next) => {
    try {
        const [address] = await getAddress({ user_id: req.userId })
        if (!address) {
            const error = new Error('some error occurred to get address!!');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({
            message: 'Address fetched!',
            data: address.map(address => ({
                address_type: address.address_type,
                address: address.address,
                state: address.state,
                country: address.country,
                zip_code: address.zip_code,
                latitude: address.latitude,
                longitude: address.longitude
            }))
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.addAddress = async (req, res, next) => {
    const { address_type, address, state, country, zip_code, latitude, longitude } = req.body;
    try {
        const [updated] = await insertAddress({ userId: req.userId, address_type, address, state, country, zip_code, latitude, longitude })
        if (!updated.affectedRows) {
            const error = new Error('add address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Adding address successful.', data: { addressId: updated.insertId } });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updateAddress = async (req, res, next) => {
    const { address_type, address, state, country, zip_code, latitude, longitude } = req.body;
    const { addressId } = req.params;
    try {
        const [updated] = await updateAddress({ userId: req.userId, address_id: addressId, address_type, address, state, country, zip_code, latitude, longitude })
        if (!updated.affectedRows) {
            const error = new Error('updating address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Updating address successful.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteAddress = async (req, res, next) => {
    const { addressId } = req.params;
    try {
        const [updated] = await deleteAddress({ userId: req.userId, address_id: addressId })
        if (!updated.affectedRows) {
            const error = new Error('deleting address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Deleting address successful.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.card = async (req, res, next) => {
    try {
        const [card] = await getCard({ user_id: req.userId })
        if (!card) {
            const error = new Error('some error occurred to get card!!');
            error.statusCode = 401;
            throw error;
        }
        res.status(200).json({
            message: 'Card fetched!',
            data: card.map(card => ({
                number: card.number,
                holder_name: card.holder_name,
                expiry: card.expiry,
                cvv: card.cvv,
            }))
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.addCard = async (req, res, next) => {
    const { number, holder_name, expiry, cvv } = req.body;
    try {
        if (expiry.split('/')[1] < new Date().getFullYear().toString().slice(-2) || (expiry.split('/')[1] === new Date().getFullYear().toString().slice(-2) && expiry.split('/')[0] <= new Date().getMonth())) {
            const error = new Error('Card expired!');
            error.statusCode = 400;
            throw error;
        }
        const [updated] = await insertCard({ userId: req.userId, number, holder_name, expiry, cvv })
        if (!updated.affectedRows) {
            const error = new Error('add address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Adding address successful.', data: { cardId: updated.insertId } });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.updateCard = async (req, res, next) => {
    const { number, holder_name, expiry, cvv } = req.body;
    const { cardId } = req.params;
    try {
        if (expiry.split('/')[1] < new Date().getFullYear().toString().slice(-2) || (expiry.split('/')[1] === new Date().getFullYear().toString().slice(-2) && expiry.split('/')[0] <= new Date().getMonth())) {
            const error = new Error('Card expired!');
            error.statusCode = 400;
            throw error;
        }
        const [updated] = await updateCard({ userId: req.userId, card_id: cardId, number, holder_name, expiry, cvv })
        if (!updated.affectedRows) {
            const error = new Error('updating address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Updating address successful.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deleteCard = async (req, res, next) => {
    const { cardId } = req.params;
    try {
        const [updated] = await deleteCard({ userId: req.userId, card_id: cardId })
        if (!updated.affectedRows) {
            const error = new Error('deleting address failed, try again!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Deleting address successful.' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}