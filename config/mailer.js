const nodemailer = require('nodemailer');
const config = require('./env');

const smtpTransporter =
  config.email.host && config.email.user && config.email.pass
    ? nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      })
    : null;

module.exports = {
  sendMail(options) {
    if (smtpTransporter) {
      return smtpTransporter.sendMail(options);
    }

    if (config.env === 'production') {
      throw new Error(
        'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.'
      );
    }

    console.log('----------------------------------------------------');
    console.log('[EMAIL DISPATCH - CONSOLE FALLBACK]');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) console.log(`Text: ${options.text}`);
    console.log('----------------------------------------------------');
    return Promise.resolve({ messageId: `mock-${Date.now()}` });
  }
};
