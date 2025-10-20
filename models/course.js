const db = require("../db");

// name: "Quantitative Reasoning"
// subject: "MATH"
// number: 123
// description: "Introduces students to the mathematics required for informed citizenship, decision making, reasoning from evidence, working with real world data, and effective communication. Students will solve problems using proportional reasoning, percentages, rates of change, linear and exponential models with applications from statistics and finance."
// credits: 3

// Courses must have a name, description, subject area, and number of credits.
const Course = db.model("Course",{
    name: {type:String, required:true},
    subject: {type:String, required:true}, // Made subject required
    number: {type:Number, min:0, max:999, required:true}, // Made number required, would have to append zeros on frontend for courses like 023 or 043
    description: String,
    credits: {type:Number, min:1, max:5, required:true} // Made credits required
});

module.exports = Course;
