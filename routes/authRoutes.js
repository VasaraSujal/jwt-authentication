const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const tokenValidations = require("../middlewares/tokenValidations");
const { validateUserData } = require("../middlewares/validations");
const User = require("../models/User"); // Added missing import for User model
// const {sendVerificationEmail} = require('../utils/email')

router.post("/register", validateUserData, authController.register);
router.post(
  "/register/resendOtp",
  authController.resendAccountVerificationOtp
);
router.post(
  "/register/verify-account",
  validateUserData,
  authController.verifyAccount
);

// Simple test endpoint without middleware
router.post("/test-verify", (req, res) => {
  console.log("Test verify endpoint hit:", req.body);
  res.json({ message: "Test endpoint working", body: req.body });
});

// Add GET route for email verification links
router.get(
  "/register/verify-account",
  tokenValidations.verifyTempToken,
  (req, res) => {
    // Extract email from token and show verification form
    const { email } = req.body;
    res.status(200).json({
      success: true,
      message: "Please enter the OTP sent to your email",
      email: email
    });
  }
);
router.post("/login", authController.login);
router.get("/showInfo", tokenValidations.verifyToken, authController.showInfo);
router.put(
  "/change-password",
  tokenValidations.verifyToken,
  authController.changePassword
);

// when user forgot their password
router.post("/forget-password", authController.forgetPassword);
router.post(
  "/forget-password/resendOtp",
  authController.resendPasswordResetOtp
);
router.post(
  "/forget-password/verifyOtp",
  tokenValidations.verifyTempToken,
  validateUserData,
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      if (user.otp !== otp) {
        return res.status(403).json({ success: false, message: "Invalid OTP" });
      }
      
      res.status(200).json({ success: true, message: "OTP verified successfully." });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);
router.post(
  "/forget-password/resetPassword",
  tokenValidations.verifyTempToken,
  validateUserData,
  authController.setNewPassword
);

// verify if user is logged in
router.post("/verify-token", tokenValidations.verifyToken, (req, res) => {
  res.status(200).json({ message: "Token is valid", data: req.body });
});

// router.post("/google",  );

// router.post("/test", sendVerificationEmail);

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = router;