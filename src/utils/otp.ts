import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export function generateOtp(): { otp: string; expires: Date } {
  const otp = crypto.randomBytes(3).toString("hex").slice(0, 6).toUpperCase();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now
  return { otp, expires };
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Password Reset OTP",
    text: `You requested a password reset. Your OTP is: ${otp}. This OTP is valid for 10 minutes.`,
    html: `<p>You requested a password reset. Your OTP is: <strong>${otp}</strong>.</p><p>This OTP is valid for 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
}
