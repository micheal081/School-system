const mongoose = require('mongoose');
const schema = mongoose.Schema;

const appliedCourseSchema = new schema({
    userId: String,
    courseId: String,
    studentName: String,
    studentEmail: String,
    courseName: String,
    courseRegNo: String,
    courseImage: String,
    tutorName: String,
    nCategories: String,
    lCategories: String,
    description: String,
    whatsapp: String,
    telegram: String,
    createdAt: Date,
    approved: Boolean
});

const appliedCourse = mongoose.model('appliedCourses', appliedCourseSchema);

module.exports = appliedCourse;