const mongoose = require('mongoose');
const schema = mongoose.Schema;

const resetPasswordSchema = new schema({
    userId: String,
    uniqueString: String,
    email: String,
    createdAt: Date,
    expiresAt: Date
});

const resetPassword = mongoose.model('resetPassword', resetPasswordSchema);

module.exports = resetPassword;