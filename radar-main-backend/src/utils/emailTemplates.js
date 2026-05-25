const getEmailWrapper = (title, bodyHtml, ctaUrl = '', ctaText = '') => {
  const ctaBlock = ctaUrl
    ? `<div class="cta-container">
         <a href="${ctaUrl}" class="cta-btn" target="_blank">${ctaText}</a>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090d16;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      background-color: #090d16;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f1424;
      border: 1px solid rgba(34, 211, 238, 0.15);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #22d3ee;
      letter-spacing: 2px;
      text-decoration: none;
    }
    .body {
      padding: 40px 30px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #ffffff;
    }
    .text {
      font-size: 15px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 30px;
    }
    .cta-container {
      text-align: center;
      margin-bottom: 30px;
      margin-top: 20px;
    }
    .cta-btn {
      display: inline-block;
      padding: 14px 30px;
      background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
      color: #090d16 !important;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(34, 211, 238, 0.3);
    }
    .details-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .details-item {
      font-size: 14px;
      margin-bottom: 10px;
      color: rgba(255, 255, 255, 0.85);
    }
    .details-label {
      font-weight: 600;
      color: #22d3ee;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background-color: #0b0f1b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">RADAR</span>
      </div>
      <div class="body">
        <div class="title">${title}</div>
        ${bodyHtml}
        ${ctaBlock}
      </div>
      <div class="footer">
        <div class="footer-text">
          This is an automated email from RADAR. Please do not reply directly to this message.<br>
          © 2026 RADAR Platform. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const getWelcomeTemplate = (username) => {
  const bodyHtml = `
    <p class="text">Hello ${username},</p>
    <p class="text">Welcome to RADAR, the next-generation trader terminal! We are excited to help you optimize your portfolio, track live market technical insights, and backtest custom strategies with professional precision.</p>
    <p class="text">Explore your new workspace dashboard and customize your layout settings to suit your trading preferences.</p>
  `;
  return getEmailWrapper('Welcome to RADAR!', bodyHtml);
};

const getVerifyTemplate = (username, verifyUrl) => {
  const bodyHtml = `
    <p class="text">Hello ${username},</p>
    <p class="text">Thank you for registering on RADAR! Please verify your email address to activate your account and gain access to the trading terminal.</p>
    <p class="text">Click the button below to confirm your email. This verification link is valid for 24 hours.</p>
  `;
  return getEmailWrapper('Verify your RADAR Account', bodyHtml, verifyUrl, 'Verify Email Address');
};

const getResetTemplate = (username, resetUrl) => {
  const bodyHtml = `
    <p class="text">Hello ${username || 'Trader'},</p>
    <p class="text">You are receiving this email because you (or someone else) requested a password reset for your RADAR account.</p>
    <p class="text">Please click the button below to reset your password. This secure link is valid for 10 minutes.</p>
    <p class="text" style="font-size: 13px; color: rgba(255,255,255,0.45);">If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;
  return getEmailWrapper('Reset your RADAR Password', bodyHtml, resetUrl, 'Reset Password');
};

const getLoginAlertTemplate = (username, details = {}) => {
  const { ip = 'Unknown', device = 'Unknown', time = new Date().toLocaleString() } = details;
  const bodyHtml = `
    <p class="text">Hello ${username},</p>
    <p class="text">We detected a new login to your RADAR account. Please verify if this was indeed you.</p>
    <div class="details-box">
      <div class="details-item"><span class="details-label">Time:</span> ${time}</div>
      <div class="details-item"><span class="details-label">IP Address:</span> ${ip}</div>
      <div class="details-item"><span class="details-label">Device/Browser:</span> ${device}</div>
    </div>
    <p class="text" style="font-size: 13px; color: #f87171;">If this action was not initiated by you, please reset your password and secure your account immediately.</p>
  `;
  return getEmailWrapper('Security Alert: New Login Detected', bodyHtml);
};

const getSupportConfirmTemplate = (username, supportMessage) => {
  const bodyHtml = `
    <p class="text">Hello ${username || 'Trader'},</p>
    <p class="text">We have successfully received your support request. A customer support representative will review your message and reach out to you shortly.</p>
    <div class="details-box">
      <div class="details-item" style="font-style: italic;">"${supportMessage}"</div>
    </div>
    <p class="text">Thank you for choosing RADAR.</p>
  `;
  return getEmailWrapper('We Received Your Support Request', bodyHtml);
};

const getPasswordChangedTemplate = (username) => {
  const bodyHtml = `
    <p class="text">Hello ${username || 'Trader'},</p>
    <p class="text">This is a confirmation that the password for your RADAR account has been successfully changed.</p>
    <p class="text">If you did not make this change, please contact RADAR support immediately.</p>
  `;
  return getEmailWrapper('RADAR Password Changed Successfully', bodyHtml);
};

module.exports = {
  getWelcomeTemplate,
  getVerifyTemplate,
  getResetTemplate,
  getLoginAlertTemplate,
  getSupportConfirmTemplate,
  getPasswordChangedTemplate
};
