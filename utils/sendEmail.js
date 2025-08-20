const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const sendVerificationEmail = async (userEmail, otp, username) => {
  // Load credentials from .env
  const myEmail = process.env.EMAIL_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUrl = process.env.REDIRECT_URL;
  const refreshToken = process.env.REFRESH_TOKEN;

  // Debug check (won’t print sensitive values)
  console.log("Email Config Loaded:", {
    EMAIL_ID: !!myEmail,
    CLIENT_ID: !!clientId,
    CLIENT_SECRET: !!clientSecret,
    REDIRECT_URL: !!redirectUrl,
    REFRESH_TOKEN: !!refreshToken,
  });

  if (!myEmail || !clientId || !clientSecret || !redirectUrl || !refreshToken) {
    throw new Error("Missing email configuration in .env file");
  }

  // Initialize OAuth2 Client
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUrl
  );

  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    // Get Access Token
    const accessToken = await oAuth2Client.getAccessToken();
    const finalAccessToken =
      typeof accessToken === "string" ? accessToken : accessToken?.token;

    if (!finalAccessToken) {
      throw new Error("Failed to obtain access token for Gmail");
    }

    // Setup Nodemailer transport
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: myEmail,
        clientId,
        clientSecret,
        refreshToken,
        accessToken: finalAccessToken,
      },
    });

    // Email Template
    const mailOptions = {
      from: `Mero Kharcha <${myEmail}>`,
      to: userEmail,
      subject: `${otp} is your Mero Kharcha ${
        username ? "account verification code" : "account recovery code"
      }`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; border: 1px solid #ddd; }
          .header { background: #111827; color: #fff; text-align: center; padding: 15px; }
          .content { padding: 20px; }
          .otp-box { margin: 30px auto; text-align: center; }
          .otp-box h2 { font-size: 32px; margin: 0; color: #111827; }
          .footer { border-top: 1px solid #ddd; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://drive.google.com/uc?export=view&id=18ywIIN7sCMiwfnt1PtbUP5N9KmOzWmsn" alt="MERO KHARCHA" width="150" />
          </div>
          <div class="content">
            <p>Dear ${username || "User"},</p>
            <p>We received your request for a single-use code for your Mero Kharcha account.</p>
            <p>Please use the following OTP ${
              username ? "to verify your account" : "to reset your password"
            }:</p>
            <div class="otp-box">
              <h2>${otp}</h2>
            </div>
            <p>If you didn’t request this, you can ignore this email.</p>
          </div>
          <div class="footer">
            <p>MERO KHARCHA: An expense management system for students.</p>
            <p>Thank you,<br/>Mero Kharcha Team</p>
          </div>
        </div>
      </body>
      </html>
      `,
    };

    // Send Email
    const info = await transport.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendVerificationEmail };