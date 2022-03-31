const mongoose = require('mongoose');
const schema = mongoose.Schema;

const messagesSchema = new schema({
    name: String,
    email: String,
    message: String,
    createdAt: Date
});

const messages = mongoose.model('messages', messagesSchema);

module.exports = messages;