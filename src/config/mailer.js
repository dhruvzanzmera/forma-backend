const nodemailer = require('nodemailer');
const config = require('./env');

let transporter = null;

const createTransporter = () => {
  if (config.email.user && config.email.pass) {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  // Fallback transporter: logs email to console in development
  return {
    sendMail: async (options) => {
      console.log('----------------------------------------------------');
      console.log(`[EMAIL DISPATCH - DEV SIMULATOR]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      if (options.text) {
        console.log(`Text: ${options.text}`);
      }
      if (options.html) {
        console.log(`HTML Snippet: ${options.html.replace(/<[^>]*>?/gm, '').trim().substring(0, 150)}...`);
      }
      console.log('----------------------------------------------------');
      return { messageId: `mock-${Date.now()}` };
    }
  };
};

transporter = createTransporter();

module.exports = transporter;
