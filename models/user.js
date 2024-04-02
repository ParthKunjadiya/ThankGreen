const db = require('../util/database');

module.exports = class User {
    constructor(profileImageUrl, name, email, hashedPw, countryCode, phoneNumber) {
        this.profileImageUrl = profileImageUrl;
        this.name = name;
        this.email = email;
        this.password = hashedPw;
        this.countryCode = countryCode;
        this.phoneNumber = phoneNumber;
    }

    save() {
        return db.execute(
            'INSERT INTO ThankGreen.users (name, email, password, profileImageUrl, country_code, phone_number, referral_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [this.name, this.email, this.password, this.profileImageUrl, this.countryCode, this.phoneNumber, 1234]
        ).then(result => {
            console.log(result)
            // Extract the auto-generated ID from the result object
            const insertedId = result[0].insertId;
            return { userId: insertedId };
        }).catch(error => {
            throw error;
        });
    }

    static find(key) {
        const keys = Object.keys(key);
        const values = Object.values(key);

        let sql = 'SELECT * FROM ThankGreen.users WHERE ';
        sql += keys.map(key => `${key} = ?`).join(' AND ');

        return db.execute(sql, values);
    }

    static updatePassword(email, newPassword) {
        return db.execute(`UPDATE ThankGreen.users SET password = ? WHERE (email = ?)`, [newPassword, email])
    }

    // static isVerify(userId) {
    //     return db.execute('UPDATE ThankGreen.users SET is_verify = 1 WHERE id = ?', [userId])
    // }

    static setResetToken(email, resetToken, resetTokenExpiry) {
        return db.execute(`UPDATE ThankGreen.users SET resetToken = ?, resetTokenExpiry = ? WHERE (email = ?)`, [resetToken, resetTokenExpiry, email])
    }
}