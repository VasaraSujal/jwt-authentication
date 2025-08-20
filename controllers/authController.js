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

    let tempToken = "";
    let otp = generateOTP();

    try {
      const otpResult = await sendOtp(email, username);
      tempToken = otpResult.tempToken;
      otp = otpResult.otp;
    } catch {
      tempToken = generateTempToken(email);
    }

    // Create or update user with plain password - let middleware handle hashing
    let user = existingUser;
    if (existingUser) {
      existingUser.username = username;
      existingUser.password = password;
      existingUser.otp = otp;
      user = await existingUser.save();
    } else {
      user = await User.create({
        username,
        email,
        password,
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
    console.error('Registration error:', error);
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
    console.log('Verifying account:', { email, otp });

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp)) {
      return sendError(res, "Invalid OTP format - must be 6 digits", 400);
    }

    const user = await User.findOne({ email });
    if (!user) return sendError(res, "User not found", 404);
    if (user.isVerified) return sendError(res, "Account already verified", 400);

    // Compare OTP
    if (user.otp !== otp) {
      return sendError(res, "Invalid OTP", 400);
    }

    // Clear OTP and mark as verified
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user);
    return res.status(200).json(successResponse("Account verified successfully", { token, user }));

  } catch (error) {
    console.error('Verification error:', error);
    return sendError(res, error.message, 500);
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
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Explicitly include password in query
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return sendError(res, "Invalid email or password", 401);
    }

    if (!user.isVerified) {
      console.log('User not verified:', email);
      return sendError(res, "Please verify your account first", 403);
    }

    // Direct password comparison
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('Invalid password for:', email);
      return sendError(res, "Invalid email or password", 401);
    }

    const token = generateToken(user);
    console.log('Login successful for:', email);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
        darkMode: user.darkMode
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, "An error occurred during login", 500);
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
    // Set OTP expiry to 5 minutes from now
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpValid = true;
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
    const { email, otp, password } = req.body;
    console.log('Reset password request:', { email, otpLength: otp?.length });

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Validate OTP
    if (!otp || user.otp !== otp) {
      return sendError(res, "Invalid OTP", 403);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user document directly to bypass pre-save middleware
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          otp: undefined,
          otpValid: false,
          otpExpiry: null
        },
        $inc: { tokenVersion: 1 }
      }
    );

    return res.status(200).json(
      successResponse("Password reset successfully")
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return sendError(res, "Failed to reset password: " + error.message, 500);
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