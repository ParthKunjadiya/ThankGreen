const express = require('express');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/auth');

const app = express();

app.use(bodyParser.json());

app.use('/api/auth', adminRoutes);

app.listen(8000);