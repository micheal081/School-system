const mongoose = require('mongoose');
const schema = mongoose.Schema;

const aCourseSchema = new schema({
    image: String,
    name: String,
    tutorName: String,
    nCategories: String,
    lCategories: String,
    description: String,
    whatsapp: String,
    telegram: String
});

const aCourse = mongoose.model('availableCourses', aCourseSchema);

module.exports = aCourse;