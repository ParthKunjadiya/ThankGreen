const cloudinary = require('cloudinary').v2;
const { extractPublicId } = require('../uploads/public_id')
const { uploader } = require('../uploads/uploader');

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
                    userId: data.id,
                    profileImageUrl: data.profileImageUrl,
                    name: data.name,
                    email: data.email,
                    phone_number: data.phone_number
                }))
            })
        );
    } catch (err) {
        console.log(err);
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
    let isImageUrl, profileImage;
    let updatedFields = req.body;
    if (updatedFields.name || updatedFields.email || updatedFields.phone_number) {
        isImageUrl = false;
        let userEmailResult, userPhoneNumberResult;
        if (updatedFields.email) {
            [userEmailResult] = await getUserData({ email: updatedFields.email })
            if (userEmailResult.length && userEmailResult[0].id !== req.userId) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 400,
                        msg: `A user with email ${userEmailResult[0].email} Already Exists.`
                    })
                );
            }
        }
        if (updatedFields.phone_number) {
            [userPhoneNumberResult] = await getUserData({ phone_number: updatedFields.phone_number })
            if (userPhoneNumberResult.length && userPhoneNumberResult[0].id !== req.userId) {
                return sendHttpResponse(req, res, next,
                    generateResponse({
                        status: "error",
                        statusCode: 400,
                        msg: `A user with phone number ${userPhoneNumberResult[0].phone_number} Already Exists.`
                    })
                );
            }
        }
    } else if (req.files && req.files['profileImage']) {
        isImageUrl = true;
        profileImage = req.files.profileImage[0].path;
        if (!profileImage) {
            return sendHttpResponse(req, res, next,
                generateResponse({
                    status: "error",
                    statusCode: 422,
                    msg: 'No file picked.',
                })
            );
        }
    } else {
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 422,
                msg: 'No file picked or any one change required.',
            })
        );
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
            const publicId = await extractPublicId(userData[0].profileImageUrl)

            // ------ Image deleting ------
            cloudinary.api.delete_resources([publicId], { type: 'upload', resource_type: 'image' })
                .then(console.log('deleted old profile image'));

            // ------ Image uploading ------
            if (req.userId && profileImage) {
                let imageResult = await uploader(profileImage);
                const [profileImageUrl = null] = imageResult ?? [];

                if (profileImageUrl) {
                    [updated] = await updateUserProfileImage({ userId: req.userId, profileImageUrl });
                }
            }
        } else {
            [updated] = await updateUserData({ userId: req.userId, updatedFields })
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
        console.log(err);
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
                data: address
            })
        );
    } catch (err) {
        console.log(err);
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
    const { address_type, address, landmark, zip_code, latitude, longitude } = req.body;
    try {
        const [updated] = await insertAddress({ user_id: req.userId, address_type, address, landmark, zip_code, latitude, longitude })
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
        console.log(err);
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
    const { address_type, address, landmark, zip_code, latitude, longitude } = req.body;
    const { addressId } = req.params;
    try {
        const [updated] = await updateAddress({ userId: req.userId, address_id: addressId, address_type, address, landmark, zip_code, latitude, longitude })
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
        console.log(err);
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
        console.log(err);
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
                data: card
            })
        );
    } catch (err) {
        console.log(err);
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
        const [updated] = await insertCard({ user_id: req.userId, number, holder_name, expiry, cvv })
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
        return sendHttpResponse(req, res, next,
            generateResponse({
                status: "error",
                statusCode: 500,
                msg: "Internal server error",
            })
        );
    }
}