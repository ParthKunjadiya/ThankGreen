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
        );
    }
}