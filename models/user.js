const db = require('../util/database');

module.exports = class User {
    constructor(name, email, hashedPw, countryCode, phoneNumber) {
        this.name = name;
        this.email = email;
        this.password = hashedPw;
        this.countryCode = countryCode;
        this.phoneNumber = phoneNumber;
    }

    save() {
        return db.execute(
            'INSERT INTO ThankGreen.users (name, email, password, country_code, phone_number, referral_code) VALUES (?, ?, ?, ?, ?, ?)',
            [this.name, this.email, this.password, this.countryCode, this.phoneNumber, 1234]
        ).then(result => {
            console.log(result)
            // Extract the auto-generated ID from the result object
            const insertedId = result[0].insertId;
            return { id: insertedId, email: this.email };
        }).catch(error => {
            throw error;
        });
    }

    static find(emailOrPhone) {
        const keys = Object.keys(emailOrPhone);
        const values = Object.values(emailOrPhone);

        let sql = 'SELECT * FROM ThankGreen.users WHERE ';
        sql += keys.map(key => `${key} = ?`).join(' AND ');

        return db.execute(sql, values);
    }
}