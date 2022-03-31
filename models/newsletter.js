const mongoose = require('mongoose');
const schema = mongoose.Schema;

const newsletterSchema = new schema({
    name: String,
    email: String,
    password: String,
    verified: Boolean
});

const newsletter = mongoose.model('newsletter', newsletterSchema);

module.exports = newsletter;