const express = require("express");
const Course = require("./models/course");
const User = require("./models/user"); 
const cors = require('cors');
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For session management

const app = express();
app.use(cors());

const secret = "supersecret"; 

// Middleware that parses HTTP requests with JSON body
app.use(express.json());

const authRequired = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: "Authentication failed. Token not provided." });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).send({ message: "Invalid or expired token." });
    }
};

const teacherRequired = (req, res, next) => {
    if (req.user.role !== 'teacher') {
        return res.status(403).send({ message: "Forbidden. Teacher role required for this action." });
    }
    next();
};

const router = express.Router();

router.get("/courses", async(req,res) =>{
   try{
      const courses = await Course.find({});
      res.send(courses);
      console.log("Retrieved all courses.");
   }
   catch (err){
      console.error("Error getting courses:", err);
      res.status(500).send({ message: "Failed to retrieve courses." });
   }
});

router.post("/courses", authRequired, teacherRequired, async(req,res) => {
   try {
        const course = await new Course(req.body);
        await course.save();
        res.status(201).json(course);
        console.log("New course created:", course.name);
   }
   catch(err){
      console.error("Error creating course:", err);
      res.status(400).send({ message: "Invalid course data.", error: err.message });
   }
});

router.put("/courses/:id", authRequired, teacherRequired, async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!course) {
            return res.status(404).send({ message: "Course not found." });
        }
        res.json(course);
        console.log("Course updated:", course.name);
    } catch (err) {
        console.error("Error updating course:", err);
        res.status(400).send({ message: "Invalid update data.", error: err.message });
    }
});

router.delete("/courses/:id", authRequired, teacherRequired, async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).send({ message: "Course not found." });
        }
        res.status(204).send();
        console.log("Course deleted:", req.params.id);
    } catch (err) {
        console.error("Error deleting course:", err);
        res.status(500).send({ message: "Failed to delete course." });
    }
});

router.post("/users/register", async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await new User({
            username,
            email,
            password: hashedPassword,
            role: (role && (role === 'teacher' || role === 'student')) ? role : 'student' 
        });

        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);
        console.log("New user registered:", user.username);
    } catch (err) {
        console.error("Error registering user:", err);
        if (err.code === 11000) { 
            return res.status(409).send({ message: "User with that email or username already exists." });
        }
        res.status(400).send({ message: "Invalid user registration data.", error: err.message });
    }
});

router.post("/users/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).send({ message: "Authentication failed. Invalid username or password." });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
             return res.status(401).send({ message: "Authentication failed. Invalid username or password." });
        }
        
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            secret, 
            { expiresIn: '1d' }
        );
        
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ 
            message: "Login successful!", 
            user: userResponse,
            token: token
        });
        console.log(`User logged in: ${user.username} (${user.role})`);

    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send({ message: "Server error during authentication." });
    }
});

router.get("/users/schedule", authRequired, async (req, res) => {
    try {
        // Populate the schedule array with full course details
        const user = await User.findById(req.user.id).populate('schedule');
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }
        // Return only the schedule array, populated with course details
        res.json(user.schedule);
    } catch (err) {
        console.error("Error fetching schedule:", err);
        res.status(500).send({ message: "Failed to fetch user schedule." });
    }
});

router.post("/users/schedule/add", authRequired, async (req, res) => {
    const { courseId } = req.body;
    
    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            return res.status(404).send({ message: "User or Course not found." });
        }

        if (user.schedule.includes(courseId)) {
            return res.status(400).send({ message: "Already enrolled in this course." });
        }

        user.schedule.push(courseId);
        await user.save();

        await user.populate('schedule');

        res.json({ 
            message: `Successfully enrolled in ${course.subject} ${course.number}.`, 
            schedule: user.schedule 
        });
    } catch (err) {
        console.error("Error enrolling in course:", err);
        res.status(500).send({ message: "Failed to add course to schedule." });
    }
});

router.post("/users/schedule/drop", authRequired, async (req, res) => {
    const { courseId } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            return res.status(404).send({ message: "User or Course not found." });
        }
        
        user.schedule.pull(courseId);
        await user.save();

        await user.populate('schedule');

        res.json({ 
            message: `Successfully dropped ${course.subject} ${course.number}.`, 
            schedule: user.schedule 
        });
    } catch (err) {
        console.error("Error dropping course:", err);
        res.status(500).send({ message: "Failed to drop course from schedule." });
    }
});


app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
