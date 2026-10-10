const nodemailer = require('nodemailer');
const config = require('./env');

const sendWithResend = async (options) => {
  if (typeof fetch !== 'function') {
    throw new Error('Resend email delivery requires Node.js 18 or newer.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.email.resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: options.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html
      }),
      signal: controller.signal
    });
    const responseBody = await response.text();

    if (!response.ok) {
      let message = responseBody;
      try {
        message = JSON.parse(responseBody).message || responseBody;
      } catch (error) {
        // Keep the provider's plain-text error response.
      }
      throw new Error(`Resend API request failed (${response.status}): ${message}`);
    }

    const result = responseBody ? JSON.parse(responseBody) : {};
    return { messageId: result.id };
  } finally {
    clearTimeout(timeout);
  }
};

const createSmtpTransporter = () => {
  const isGmail =
    config.email.host.includes('gmail') || config.email.user.includes('gmail');
  const transportOptions = isGmail
    ? { service: 'gmail' }
    : {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465
      };

  return nodemailer.createTransport({
    ...transportOptions,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
};

const smtpTransporter =
  !config.isRender &&
  !config.email.resendApiKey &&
  config.email.user &&
  config.email.pass
    ? createSmtpTransporter()
    : null;

module.exports = {
  sendMail(options) {
    if (config.email.resendApiKey) {
      return sendWithResend(options);
    }

    if (smtpTransporter) {
      return smtpTransporter.sendMail(options);
    }

    if (config.isRender) {
      throw new Error(
        'Render blocks outbound SMTP. Configure RESEND_API_KEY and a verified EMAIL_FROM address.'
      );
    }

    if (config.env === 'production') {
      throw new Error(
        'Email delivery is not configured. Set RESEND_API_KEY and a verified EMAIL_FROM address.'
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
