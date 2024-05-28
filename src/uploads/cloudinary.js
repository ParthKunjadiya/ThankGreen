const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const uploads = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'ThankGreen',
        })
            .then(console.log('Image upload successfully'));
        return result;
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = { uploads };