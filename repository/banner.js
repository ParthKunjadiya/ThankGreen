const db = require('../util/database');

const getBanner = async () => {
    let sql = `SELECT
            b.url AS banner_image,
            b.horizontal_priority,
            b.vertical_priority
        FROM
            banner b`

    return await db.query(sql)
}

module.exports = {
    getBanner
};