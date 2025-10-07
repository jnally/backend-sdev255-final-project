const db = require("../db");

const Course = db.model("Course",{
    name: {type:String, require:true},
    number: Number,
    description: String,
    subject: String,
    credits: {type:Number, min:1, max:5}
});

module.exports = Course;