const mongoose = require('mongoose');
const schema = mongoose.Schema;

const studentSchema = new schema({
    name: String,
    email: String,
    image: String,
    occupation: String,
    telephone: String,
    address: String,
    city: String,
    state: String,
    postcode: String,
    linkedIn: String,
    facebook: String,
    twitter: String,
    instagram: String,
    password: String,
    verified: Boolean
});

const student = mongoose.model('students', studentSchema);

module.exports = student;