const mongoose = require("mongoose");
require("dotenv").config();

const DB_URL = process.env.MONGO_DB_URL;

const connectDB = async () => {
  try {
    // Set strictQuery to false to prepare for Mongoose 7
    mongoose.set('strictQuery', false);
    
    // Add connection options for better reliability
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };
    
    await mongoose.connect(DB_URL, options);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    // Don't throw the error, just log it to prevent server crash
    console.log("Will retry connection in 5 seconds...");
    setTimeout(connectDB, 5000); // Retry connection after 5 seconds
  }
};

module.exports = connectDB;