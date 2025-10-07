const express = require("express");
const Course = require("./models/course");
var cors = require('cors')

const app = express();
app.use(cors());

// Middleware that parses HTTP requests with JSON body
app.use(express.json());

const router = express.Router();

// Get list of all courses in the database
router.get("/courses", async(req,res) =>{
   try{
      const courses = await Course.find({});
      res.send(courses);
      console.log(courses);
   }
   catch (err){
      console.log(err);
   }

})

router.post("/courses", async(req,res) =>{
   try{
      const course = await new Course(req.body);
      await course.save();
      res.status(201).json(course);
      console.log(course);
   }
   catch(err){
      res.status(400).send(err);
   }
});


app.use("/api", router);

app.listen(3000);