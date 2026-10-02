const nodemailer = require('nodemailer');
const config = require('./env');

let transporter = null;

const createTransporter = () => {
  // 1. Resend API support (HTTPS over port 443 - works on Render Free Tier without SMTP block)
  if (process.env.RESEND_API_KEY) {
    return {
      sendMail: async (options) => {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'onboarding@resend.dev',
            to: [options.to],
            subject: options.subject,
            html: options.html,
            text: options.text
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Resend API error (${response.status}): ${errText}`);
        }

        return await response.json();
      }
    };
  }

  // 2. Nodemailer SMTP (Note: Render Free Tier drops outbound packets on ports 25, 465, 587)
  if (config.email.user && config.email.pass) {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000
    });
  }

  // 3. Fallback transporter: logs email to console
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

transporter = createTransporter();

module.exports = transporter;
