const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://sdev255:sdev255@coursedb.jstiozs.mongodb.net/?retryWrites=true&w=majority",
    {useNewUrlParser: true});

module.exports = mongoose;

