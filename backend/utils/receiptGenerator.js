const nodemailer = require("nodemailer");

function generateReceiptHtml({ donationId, userName, userEmail, ngoName, amount, date }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://resence.in/verify-receipt/${donationId}`)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #F8FAFC; color: #0A1628; margin: 0; padding: 40px 20px; }
        .receipt-card { max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02); }
        .brand-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 24px; }
        .brand-name { font-size: 1.5rem; font-weight: 800; color: #0A1628; }
        .brand-name span { color: #00B8A9; }
        .brand-subtitle { font-size: 0.78rem; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .receipt-title { font-size: 1.1rem; font-weight: 700; color: #64748B; margin-bottom: 8px; }
        .amount-display { font-size: 2.25rem; font-weight: 800; color: #0A1628; margin-bottom: 24px; }
        .info-grid { display: grid; gap: 16px; margin-bottom: 28px; }
        .info-row { display: flex; justify-content: space-between; font-size: 0.88rem; }
        .info-label { color: #64748B; }
        .info-value { font-weight: 600; text-align: right; }
        .qr-section { display: flex; flex-direction: column; align-items: center; background: #F8FAFC; border: 1px dashed #E2E8F0; border-radius: 8px; padding: 20px; text-align: center; }
        .qr-img { width: 120px; height: 120px; margin-bottom: 12px; }
        .qr-text { font-size: 0.75rem; color: #64748B; line-height: 1.4; }
        .qr-text strong { color: #00B8A9; }
        .footer-note { text-align: center; font-size: 0.75rem; color: #94A3B8; margin-top: 32px; border-top: 1px solid #F1F5F9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="brand-header">
          <div>
            <div class="brand-name">Serve<span>Mate</span></div>
            <div style="font-size: 0.75rem; color: #64748B;">by Resence</div>
          </div>
          <div style="text-align: right;">
            <span class="brand-subtitle">Receipt</span>
          </div>
        </div>

        <div class="receipt-title">Total Contribution</div>
        <div class="amount-display">₹${amount.toLocaleString('en-IN')}</div>

        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Transaction ID</span>
            <span class="info-value" style="font-family: monospace; font-size: 0.8rem;">${donationId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date</span>
            <span class="info-value">${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NGO Partner</span>
            <span class="info-value" style="color: #00B8A9;">${ngoName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Donor Profile</span>
            <span class="info-value">${userName} (${userEmail})</span>
          </div>
        </div>

        <div class="qr-section">
          <img src="${qrCodeUrl}" class="qr-img" alt="Verification QR Code">
          <div class="qr-text">
            Scan this QR code to view the <strong>Public Impact Ledger</strong> verification proof videos for this campaign.
          </div>
        </div>

        <div class="footer-note">
          Small Contributions. Real Impact.<br>
          Thank you for backing verified social change.
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendReceiptEmail({ donationId, userName, userEmail, ngoName, amount, date }) {
  const htmlContent = generateReceiptHtml({ donationId, userName, userEmail, ngoName, amount, date });

  // Fallback to console printing if SMTP keys are not configured
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  
  if (!host || !user || !pass) {
    console.log(`[mailer-fallback] Sending receipts disabled (SMTP variables missing in env).`);
    console.log(`[mailer-fallback] Receipt for: ${userEmail} | Amount: ₹${amount} | NGO: ${ngoName}`);
    console.log(`[mailer-fallback] Scan QR link data: https://resence.in/verify-receipt/${donationId}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: { user, pass }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"ServeMate Receipts" <receipts@resence.in>',
      to: userEmail,
      subject: `ServeMate - Receipt for ₹${amount} Contribution`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[mailer] Receipt email successfully dispatched to:", userEmail, "MessageId:", info.messageId);
    return info;
  } catch (err) {
    console.error("[mailer] Failed to send receipt email:", err.message);
  }
}

module.exports = { generateReceiptHtml, sendReceiptEmail };
