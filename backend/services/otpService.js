const nodemailer = require("nodemailer");

// Simple in-memory OTP storage mapping email -> { otp, expires }
const otpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  });
}

async function sendOtp(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("Email address is required");

  const otp = generateOtp();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
  otpStore.set(cleanEmail, { otp, expires });

  console.log(`[otp] Generated OTP for ${cleanEmail}: ${otp}`);

  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[otp] SMTP configuration missing. OTP logged to console. Simulated delivery.");
    return {
      success: true,
      simulated: true,
      otp, // return OTP in simulated mode for easy local sandbox debugging!
      message: "OTP sent successfully (Simulated)"
    };
  }

  const mailOptions = {
    from: `"ServeMATE Verification" <${process.env.SMTP_USER}>`,
    to: cleanEmail,
    subject: `🔑 ${otp} is your ServeMATE Verification Code`,
    html: `
      <div style="background-color:#0A0F1E; color:#E8EAF0; font-family:'Inter',system-ui,sans-serif; padding:40px; border-radius:16px; max-width:540px; margin:0 auto; border: 1px solid rgba(255,255,255,0.08);">
        <div style="text-align:center; margin-bottom:30px;">
          <h1 style="font-family:'Space Grotesk',sans-serif; font-size:28px; font-weight:800; margin:0; color:#4F8EF7;">
            Serve<span style="color:#FFF;">MATE</span>
          </h1>
          <p style="color:#9AA3B8; font-size:14px; margin-top:5px; text-transform:uppercase; letter-spacing:1px;">Email Verification System</p>
        </div>
        <div style="background-color:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:30px; border-radius:12px; text-align:center; margin-bottom:30px;">
          <p style="color:#9AA3B8; font-size:15px; margin-top:0; margin-bottom:20px;">Use the following 6-digit One-Time Password (OTP) to verify your email address and complete registration:</p>
          <div style="font-family:'Space Grotesk',sans-serif; font-size:36px; font-weight:800; letter-spacing:6px; color:#10B981; margin-bottom:20px; padding:12px; background:rgba(16,185,129,0.08); border-radius:8px; display:inline-block; border:1px solid rgba(16,185,129,0.2);">
            ${otp}
          </div>
          <p style="color:#636D85; font-size:12px; margin:0;">This code is strictly valid for the next <strong>5 minutes</strong>. Do not share this OTP with anyone.</p>
        </div>
        <div style="text-align:center; color:#636D85; font-size:12px; border-top:1px solid rgba(255,255,255,0.08); padding-top:20px;">
          <p style="margin:0 0 4px 0;">ServeMATE by Resence — India's Most Transparent Giving Platform</p>
          <p style="margin:0;"><a href="https://resence.in" style="color:#4F8EF7; text-decoration:none;">resence.in</a></p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[otp] Email sent successfully to ${cleanEmail}`);
    return {
      success: true,
      simulated: false,
      message: "OTP sent successfully"
    };
  } catch (smtpErr) {
    console.error(`[otp] SMTP delivery failed for ${cleanEmail}: ${smtpErr.message}. Falling back to simulated mode.`);
    return {
      success: true,
      simulated: true,
      otp,
      message: "Email delivery failed. Use the code shown on screen.",
      smtpError: smtpErr.message
    };
  }
}

function verifyOtp(email, submittedOtp) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const entry = otpStore.get(cleanEmail);

  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expires) {
    otpStore.delete(cleanEmail); // cleanup expired OTP
    return false;
  }

  const isValid = String(entry.otp) === String(submittedOtp).trim();
  if (isValid) {
    otpStore.delete(cleanEmail); // consume OTP on successful verification
  }

  return isValid;
}

module.exports = {
  sendOtp,
  verifyOtp
};
