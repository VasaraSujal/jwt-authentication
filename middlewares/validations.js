const joi = require("joi");
const { sendError } = require("../utils/response");

const validateUserData = (req, res, next) => {
  try {
    console.log("Validation middleware - Request body:", req.body);
    
    const registrationSchema = joi.object({
      username: joi.string().min(3).max(30).required().messages({
        "string.base": "Username should be a type of text",
        "string.empty": "Username cannot be an empty field",
        "string.min": "Username should have a minimum length of {#limit}",
        "string.max": "Username should have a maximum length of {#limit}",
        "any.required": "Username is a required field",
      }),
      email: joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email cannot be an empty field",
        "any.required": "Email is a required field",
      }),
      password: joi.string().min(6).max(18).required().messages({
        "string.min": "New password should have a minimum length of {#limit}",
        "string.max": "New password should have a maximum length of {#limit}",
        "string.empty": "New password cannot be an empty field",
        "any.required": "New password is a required field",
      }),
    });

    const otpSchema = joi.object({
      email: joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email cannot be an empty field",
        "any.required": "Email is a required field",
      }),
      otp: joi
        .string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
          "string.pattern.base": "OTP must be a 6-digit number",
          "string.empty": "OTP cannot be an empty field",
          "any.required": "OTP is a required field",
        }),
    });

    const validateOtp = joi.object({
      otp: joi
        .string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
          "string.pattern.base": "OTP must be a 6-digit number",
          "string.empty": "OTP cannot be an empty field",
          "any.required": "OTP is a required field",
        }),
    });

    const resetPasswordSchema = joi.object({
      newPassword: joi.string().min(6).max(18).required().messages({
        "string.min": "New password should have a minimum length of {#limit}",
        "string.max": "New password should have a maximum length of {#limit}",
        "string.empty": "New password cannot be an empty field",
        "any.required": "New password is a required field",
      }),
      otp: joi
        .string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
          "string.pattern.base": "OTP must be a 6-digit number",
          "string.empty": "OTP cannot be an empty field",
          "any.required": "OTP is a required field",
        }),
    });

    let schema;

    if (req.body.username && req.body.email && req.body.password) {
      console.log("Using registration schema");
      schema = registrationSchema;
    } else if (req.body.email && req.body.otp) {
      console.log("Using OTP schema");
      schema = otpSchema;
    } else if (req.body.newPassword && req.body.otp) {
      console.log("Using reset password schema");
      schema = resetPasswordSchema;
    } else if (req.body.otp) {
      console.log("Using validate OTP schema");
      schema = validateOtp;
    } else {
      console.log("No matching schema found, body:", req.body);
      return sendError(res, "Validation not defined", 400);
    }

    const { error } = schema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details);
      return sendError(
        res,
        error.details.map((err) => err.message),
        400
      );
    }

    console.log("Validation passed successfully");
    next();
  } catch (error) {
    console.log("Validation middleware error:", error);
    return sendError(res, "Internal server error", 500);
  }
};

module.exports = {
  validateUserData,
};