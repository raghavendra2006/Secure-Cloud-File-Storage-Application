const nodemailer = require('nodemailer');

const createTransporter = () =>
    nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

/**
 * Send OTP email to user
 * @param {string} to - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @param {string} filename - File being requested
 */
const sendOTPEmail = async (to, otp, filename) => {
    const transporter = createTransporter();

    const expireMinutes = process.env.OTP_EXPIRE_MINUTES || 5;

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; padding: 40px; margin: 0;">
      <div style="max-width: 500px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d4e;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">☁️ SecureStore</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Your Secure Cloud Storage</p>
        </div>
        <div style="padding: 36px;">
          <h2 style="color: #a78bfa; margin: 0 0 12px;">Download Verification</h2>
          <p style="color: #94a3b8; margin: 0 0 20px; font-size: 15px;">
            You requested to download the file: <strong style="color: #e2e8f0;">${filename}</strong>
          </p>
          <p style="color: #94a3b8; margin: 0 0 28px; font-size: 14px;">
            Use the OTP below to verify your download. It expires in <strong style="color: #f59e0b;">${expireMinutes} minutes</strong>.
          </p>
          <div style="background: #0f0f1a; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 28px; border: 1px solid #2d2d4e;">
            <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Your OTP</p>
            <p style="margin: 0; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #a78bfa;">${otp}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
            If you did not request this download, please ignore this email.
          </p>
        </div>
        <div style="background: #0f0f1a; padding: 16px; text-align: center; border-top: 1px solid #2d2d4e;">
          <p style="margin: 0; color: #475569; font-size: 12px;">© 2024 SecureStore — All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

    await transporter.sendMail({
        from: `"SecureStore" <${process.env.EMAIL_FROM}>`,
        to,
        subject: `🔐 Your Download OTP: ${otp} — SecureStore`,
        html,
    });
};

module.exports = { sendOTPEmail };
