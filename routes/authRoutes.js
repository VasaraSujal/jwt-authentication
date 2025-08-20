const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tokenValidations = require("../middlewares/tokenValidations");
const { validateUserData } = require("../middlewares/validations");
const User = require("../models/User");

// ================= AUTH ROUTES =================

// Register
router.post("/register", validateUserData, authController.register);
router.post("/register/resendOtp", authController.resendAccountVerificationOtp);
router.post("/register/verify-account", validateUserData, authController.verifyAccount);

// Simple test endpoint
router.post("/test-verify", (req, res) => {
  console.log("Test verify endpoint hit:", req.body);
  res.json({ message: "Test endpoint working", body: req.body });
});

// Verify account via link
router.get("/register/verify-account", tokenValidations.verifyTempToken, (req, res) => {
  const { email } = req.user; // ✅ tokenValidations puts email in req.user
  res.status(200).json({
    success: true,
    message: "Please enter the OTP sent to your email",
    email: email
  });
});

// Login / Profile
router.post("/login", authController.login);
router.get("/showInfo", tokenValidations.verifyToken, authController.showInfo);
router.put("/change-password", tokenValidations.verifyToken, authController.changePassword);

// ================= FORGOT PASSWORD FLOW =================

// 1️⃣ Send OTP
router.post("/forget-password", authController.forgetPassword);

// 2️⃣ Resend OTP
router.post("/forget-password/resendOtp", authController.resendPasswordResetOtp);

// 3️⃣ Verify OTP ✅ No JWT needed
router.post("/forget-password/verifyOtp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(403).json({ success: false, message: "Invalid OTP" });
    }

    // ✅ Mark OTP verified temporarily (for reset step)
    user.isOtpVerified = true;
    await user.save();

    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// 4️⃣ Reset Password ✅ No JWT needed, just email+otp+newPassword
router.post("/forget-password/resetPassword", authController.setNewPassword);

// ================= TOKEN VALIDATION =================
router.post("/verify-token", tokenValidations.verifyToken, (req, res) => {
  res.status(200).json({ message: "Token is valid", data: req.body });
});

// Global error handler
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = router;