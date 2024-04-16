const { uploads } = require('../uploads/cloudinary');

const uploader = async (...imgs) => {
    const urls = [];

    for (let img of imgs) {
        const img_newPath = await uploads(img);
        let img_url = (img_newPath && img_newPath.secure_url) || ""
        urls.push(img_url);
    }
    return urls;
};

module.exports = { uploader }