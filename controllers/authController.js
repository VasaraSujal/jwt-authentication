const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { secretKey, expiresIn, OTPexpiresIn } = require("../config/jwt");
const { generateOTP } = require("../utils/generateOTP");
const { sendVerificationEmail } = require("../utils/sendEmail");
const { successResponse, sendError } = require("../utils/response");

/**
 * Generate main JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username,
      profilePicture: user.profilePicture,
      darkMode: user.darkMode,
      tokenVersion: user.tokenVersion,
    },
    secretKey,
    { expiresIn }
  );
};

/**
 * Generate short-lived token for OTP flows
 */
const generateTempToken = (email) => {
  return jwt.sign({ email }, secretKey, { expiresIn: OTPexpiresIn });
};

/**
 * Send OTP via email
 */
const sendOtp = async (email, name = null) => {
  try {
    const otp = generateOTP();

    try {
      await sendVerificationEmail(email, otp, name);
      console.log("✅ OTP sent to:", email);
    } catch (emailError) {
      console.error("⚠️ Error sending verification email:", emailError);
    }

    const tempToken = generateTempToken(email);
    return { tempToken, otp };
  } catch (error) {
    console.error("❌ Error in sendOtp:", error);
    const fallbackOtp = generateOTP();
    const fallbackToken = generateTempToken(email);
    return { tempToken: fallbackToken, otp: fallbackOtp };
  }
};

/**
 * Register User
 */
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return sendError(res, "User already registered, please login.", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let tempToken = "";
    let otp = generateOTP();

    try {
      const otpResult = await sendOtp(email, username);
      tempToken = otpResult.tempToken;
      otp = otpResult.otp;
    } catch {
      tempToken = generateTempToken(email);
    }

    let user;
    if (existingUser) {
      existingUser.username = username;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      user = await existingUser.save();
    } else {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        otp,
        isVerified: false,
      });
    }

    const verificationUrl = `http://localhost:5173/verify-account?tempToken=${tempToken}`;
    res.status(201).json(
      successResponse("Verify account using OTP sent to your email", {
        verificationUrl,
      })
    );
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Resend OTP for account verification
 */
const resendAccountVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);
    if (user.isVerified) return sendError(res, "Account already verified", 400);

    const { tempToken, otp } = await sendOtp(email, user.username);
    user.otp = otp;
    await user.save();

    return res
      .status(200)
      .json(successResponse("OTP resent successfully", { newTempToken: tempToken }));
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * Verify account with OTP
 */
const verifyAccount = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);
    if (user.isVerified) return sendError(res, "Account already verified", 400);

    if (user.otp && user.otp !== otp) {
      return sendError(res, "Invalid OTP", 400);
    }

    user.isVerified = true;
    user.otp = "";
    await user.save();

    const token = generateToken(user);

    return res.status(200).json(
      successResponse("User verified and logged in successfully", {
        user,
        token,
      })
    );
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * Login User (using ObjectId instead of email)
 */
/**
 * Login User (using email instead of ObjectId)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body; // ✅ expect email + password

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // generate JWT (use your generateToken helper for consistency)
    const token = generateToken(user);

    res.json({
      token,
      user, // return full user object (frontend already expects user.username)
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/**
 * Show user info
 */
const showInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    return res
      .status(200)
      .json(successResponse("User data retrieved successfully", { user }));
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * Change Password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return sendError(res, "User not found", 404);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) return sendError(res, "Current password is incorrect", 401);

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json(successResponse("Password changed successfully"));
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

/**
 * Forgot Password (send OTP)
 */
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);

    const { tempToken, otp } = await sendOtp(email);
    user.otp = otp;
    await user.save();

    return res
      .status(200)
      .json(successResponse("OTP sent successfully!", { tempToken }));
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * Resend Forgot Password OTP
 */
const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);

    const { tempToken, otp } = await sendOtp(email);
    user.otp = otp;
    await user.save();

    return res
      .status(200)
      .json(successResponse("OTP resent successfully!", { newTempToken: tempToken }));
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * Reset Password with OTP
 */
const setNewPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);
    if (user.otp !== otp) return sendError(res, "Invalid OTP", 403);

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = "";
    user.tokenVersion += 1;
    await user.save();

    const token = generateToken(user);

    return res
      .status(200)
      .json(successResponse("Password changed successfully", { user, token }));
  } catch (error) {
    return sendError(res, "Internal server error", 500);
  }
};

module.exports = {
  register,
  verifyAccount,
  resendAccountVerificationOtp,
  login,
  showInfo,
  changePassword,
  forgetPassword,
  resendPasswordResetOtp,
  setNewPassword,
};