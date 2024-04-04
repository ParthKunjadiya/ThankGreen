const cloudinary = require('cloudinary').v2;

const {
    getUserData,
    updateUserProfileImage,
    updateUserData
} = require('../repository/user');

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
            data: {
                profileImageUrl: data[0].profileImageUrl,
                name: data[0].name,
                email: data[0].email,
                phone_number: data[0].phone_number
            }
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
    console.log(req.file)
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