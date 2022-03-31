const mongoose = require('mongoose');
const schema = mongoose.Schema;

const adminSchema = new schema({
    name: String,
    email: String,
    image: String,
    password: String
});

const admin = mongoose.model('admins', adminSchema);

module.exports = admin;