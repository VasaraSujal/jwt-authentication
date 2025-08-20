const mongoose = require("mongoose");
require("dotenv").config();

const DB_URL = process.env.MONGO_DB_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Will retry connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;