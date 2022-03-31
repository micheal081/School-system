const mongoose = require('mongoose');
const schema = mongoose.Schema;

const studentVerificationSchema = new schema({
    userId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date
});

const studentVerification = mongoose.model('studentVerification', studentVerificationSchema);

module.exports = studentVerification;