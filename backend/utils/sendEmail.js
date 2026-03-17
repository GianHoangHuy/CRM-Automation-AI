const nodemailer = require('nodemailer');

async function createTransporter() {
  // Nếu có cấu hình SMTP thực sự, dùng nó
  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.example.com') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true', // true cho port 465
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  }

  // Fallback cho dev: dùng Ethereal (test mail) hoặc console transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    // Cuối cùng fallback: fake transport that logs to console
    return {
      sendMail: async (mailOptions) => {
        console.log('[sendEmail:console-fallback] mailOptions:', mailOptions);
        return { accepted: [mailOptions.to], messageId: 'console-fallback' };
      }
    };
  }
}

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = await createTransporter();
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'no-reply@example.com',
    to,
    subject,
    html,
    text
  };

  const info = await transporter.sendMail(mailOptions);

  // nếu dùng Ethereal show preview URL
  if (nodemailer.getTestMessageUrl && info) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) console.log('[sendEmail] Preview URL:', url);
  }

  return info;
};

module.exports = sendEmail;