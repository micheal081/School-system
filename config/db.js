require('dotenv').config();

const mongoose = require('mongoose');

mongoose
    .connect(process.env.ONLINE_MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Successfully connected to the database");
    })
    .catch((err) => console.log(err));