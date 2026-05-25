const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Read variables from process.env
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_EMAIL || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;

    console.log(`[SMTP-debug] Preparing to send email. Host: ${host}:${port}, User: ${user}`);

    if (!user || !pass || user.includes('YOUR_') || user.includes('your_')) {
        console.warn(`⚠️ [SMTP-debug] SMTP credentials not configured (SMTP_EMAIL/EMAIL_USER and SMTP_PASSWORD/EMAIL_PASS). Skipping email to: ${options.to || options.email}`);
        return null;
    }

    // Configure transporter
    const transporterConfig = {
        host: host,
        port: port,
        secure: port === 465, // true for 465, false for 587/others
        auth: {
            user: user,
            pass: pass
        }
    };

    // If port is 587, explicitly allow STARTTLS/security options
    if (port === 587) {
        transporterConfig.requireTLS = true;
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    const fromName = process.env.FROM_NAME || 'RADAR Support';
    const mailOptions = {
        from: `"${fromName}" <${user}>`,
        to: options.to || options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
        replyTo: options.replyTo,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SMTP-debug] Email sent successfully: messageId=${info.messageId} to=${mailOptions.to}`);
        return info;
    } catch (error) {
        console.error(`❌ [SMTP-debug] Failed to send email to ${mailOptions.to}:`, error.message);
        // Do not throw here so that auth routes can degrade gracefully if credentials fail
        return null;
    }
};

module.exports = sendEmail;
