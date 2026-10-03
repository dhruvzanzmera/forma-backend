const nodemailer = require('nodemailer');
const config = require('./env');

/**
 * Pure Nodemailer Transporter Configuration
 * Automatically configures Gmail service or custom SMTP
 */
const createTransporter = () => {
  if (config.email.user && config.email.pass) {
    const isGmail =
      (config.email.host && config.email.host.includes('gmail')) ||
      (config.email.user && config.email.user.includes('gmail'));

    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      : {
          host: config.email.host,
          port: config.email.port,
          secure: config.email.port === 465,
          auth: {
            user: config.email.user,
            pass: config.email.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        };

    const mailer = nodemailer.createTransport(transportOptions);

    if (config.env !== 'test') {
      mailer.verify((error) => {
        if (error) {
          console.warn(`[Nodemailer Warning] SMTP verification failed: ${error.message}`);
        } else {
          console.log(`[Nodemailer] Connected successfully to ${isGmail ? 'Gmail' : config.email.host} as ${config.email.user}`);
        }
      });
    }

    return mailer;
  }

  // Fallback transporter: logs email to console in development
  return {
    sendMail: async (options) => {
      console.log('----------------------------------------------------');
      console.log(`[EMAIL DISPATCH - CONSOLE FALLBACK]`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      if (options.text) console.log(`Text: ${options.text}`);
      console.log('----------------------------------------------------');
      return { messageId: `mock-${Date.now()}` };
    }
  };
};

const transporter = createTransporter();

module.exports = transporter;
