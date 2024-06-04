const admin = require("firebase-admin");
const serviceAccount = require('../util/thankgreen-parth-firebase-adminsdk-alkix-5ac96384a9.json');

module.exports = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

return admin;