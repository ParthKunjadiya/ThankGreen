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
const { generateResponse, sendHttpResponse } = require("../helper/response");

exports.getInfo = async (req, res, next) => {
    try {
        const [data] = await getUserData({ id: req.userId })
        if (!data) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Unauthorized user!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Information fetched!',
                data: data.map(data => ({
                    profileImageUrl: data.profileImageUrl,
                    name: data.name,
                    email: data.email,
                    phone_number: data.country_code + data.phone_number
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.updateInfo = async (req, res, next) => {
    let name, email, phoneNumber, profileImageUrl, isImageUrl;
    if (req.body.name !== undefined && req.body.email !== undefined && req.body.phoneNumber !== undefined) {
        isImageUrl = false;
        name = req.body.name;
        email = req.body.email;
        phoneNumber = req.body.phoneNumber;

        // const [userEmailResult] = await getUserData({ email })
        // const [userPhoneNumberResult] = await getUserData({ phone_number: phoneNumber })
        // if (userEmailResult.length || userPhoneNumberResult.length) {
        //     return sendHttpResponse(req, res, next,
        //         generateResponse({
        //             status: "error",
        //             statusCode: 400,
        //             msg: (userEmailResult.length ? 'A user with this email Already Exists.' : '') + (userPhoneNumberResult.length ? 'A user with this phone number Already Exists.' : ''),
        //         })
        //     );
        // }
    } else if (req.file) {
        isImageUrl = true;
        profileImageUrl = req.file.path;
        if (!profileImageUrl) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 422,
                    msg: 'No file picked.',
                })
            );
        }
    }
    let updated;
    try {
        if (isImageUrl) {
            const [userData] = await getUserData({ id: req.userId });
            if (!userData.length) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 401,
                        msg: 'Unauthorized user!',
                    })
                );
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
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, updating user failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: isImageUrl ? 'User profile image updated successfully.' : 'User detail updated successfully.'
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.address = async (req, res, next) => {
    try {
        const [address] = await getAddress({ user_id: req.userId })
        if (!address) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Unauthorized user!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Address fetched!',
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
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.addAddress = async (req, res, next) => {
    const { address_type, address, state, country, zip_code, latitude, longitude } = req.body;
    try {
        const [updated] = await insertAddress({ userId: req.userId, address_type, address, state, country, zip_code, latitude, longitude })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Try again',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Adding address successful.',
                data: {
                    addressId: updated.insertId
                }
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.updateAddress = async (req, res, next) => {
    const { address_type, address, state, country, zip_code, latitude, longitude } = req.body;
    const { addressId } = req.params;
    try {
        const [updated] = await updateAddress({ userId: req.userId, address_id: addressId, address_type, address, state, country, zip_code, latitude, longitude })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, updating address failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Updating address successful.'
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.deleteAddress = async (req, res, next) => {
    const { addressId } = req.params;
    try {
        const [updated] = await deleteAddress({ userId: req.userId, address_id: addressId })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, deleting address failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Deleting address successful.'
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.card = async (req, res, next) => {
    try {
        const [card] = await getCard({ user_id: req.userId })
        if (!card) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Unauthorized user!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Card detail fetched!',
                data: card.map(card => ({
                    number: card.number,
                    holder_name: card.holder_name,
                    expiry: card.expiry,
                    cvv: card.cvv,
                }))
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.addCard = async (req, res, next) => {
    const { number, holder_name, expiry, cvv } = req.body;
    try {
        if (expiry.split('/')[1] < new Date().getFullYear().toString().slice(-2) || (expiry.split('/')[1] === new Date().getFullYear().toString().slice(-2) && expiry.split('/')[0] <= new Date().getMonth())) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Card Expired!',
                })
            );
        }
        const [updated] = await insertCard({ userId: req.userId, number, holder_name, expiry, cvv })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 401,
                    msg: 'Internal server error, Try again',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Adding card successful.',
                data: {
                    cardId: updated.insertId
                }
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.updateCard = async (req, res, next) => {
    const { number, holder_name, expiry, cvv } = req.body;
    const { cardId } = req.params;
    try {
        if (expiry.split('/')[1] < new Date().getFullYear().toString().slice(-2) || (expiry.split('/')[1] === new Date().getFullYear().toString().slice(-2) && expiry.split('/')[0] <= new Date().getMonth())) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Card Expired!',
                })
            );
        }
        const [updated] = await updateCard({ userId: req.userId, card_id: cardId, number, holder_name, expiry, cvv })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, updating card failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Updating card successful.'
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}

exports.deleteCard = async (req, res, next) => {
    const { cardId } = req.params;
    try {
        const [updated] = await deleteCard({ userId: req.userId, card_id: cardId })
        if (!updated.affectedRows) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 400,
                    msg: 'Internal server error, deleting card failed!',
                })
            );
        }
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "success",
                statusCode: 200,
                msg: 'Deleting card successful.'
            })
        );
    } catch (err) {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}