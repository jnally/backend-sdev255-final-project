const db = require("../db");

// name: "Quantitative Reasoning"
// subject: "MATH"
// number: 123
// description: "Introduces students to the mathematics required for informed citizenship, decision making, reasoning from evidence, working with real world data, and effective communication. Students will solve problems using proportional reasoning, percentages, rates of change, linear and exponential models with applications from statistics and finance."
// credits: 3

const Course = db.model("Course",{
    name: {type:String, require:true},
    subject: String,
    number: Number,
    description: String,
    credits: {type:Number, min:1, max:5}
});

module.exports = Course;