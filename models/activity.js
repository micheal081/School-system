const mongoose = require('mongoose');
const schema = mongoose.Schema;

const activitySchema = new schema({
    userId: String,
    email: String,
    message: String,
    createdAt: Date
});

const activity = mongoose.model('activity', activitySchema);

module.exports = activity;