require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ 
  credentials: true, 
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:5176",
    "http://localhost:5177"
  ] 
}));
app.use(express.json()); // Parse JSON bodies, result in 'req.body'
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies, result in 'req.body'
app.use(cookieParser()); // Parse cookies, result in 'req.cookies'

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.use("/auth", authRoutes);

// Serve verification page
app.get('/verify-account', (req, res) => {
  res.sendFile(__dirname + '/public/verify.html');
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Root route - redirect to frontend
app.get('/', (req, res) => {
  res.redirect('http://localhost:5174/');
});

// Middle to handle uncatched error, yesle server shutdown hunw batw bachauxw
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});