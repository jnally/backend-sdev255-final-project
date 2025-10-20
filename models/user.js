const db = require("../db");

const User = db.model("User", {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['teacher', 'student'], default: 'student' },
    password: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now },
    schedule: [{
        type: db.Schema.Types.ObjectId,
        ref: 'Course'
    }]
});

module.exports = User;
