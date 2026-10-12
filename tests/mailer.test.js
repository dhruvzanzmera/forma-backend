jest.mock('nodemailer', () => ({
  createTransport: jest.fn()
}));

let nodemailer;
const environmentKeys = [
  'NODE_ENV',
  'EMAIL_FROM',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'RENDER',
  'RENDER_SERVICE_ID'
];
const originalEnvironment = {};

describe('email delivery configuration', () => {
  beforeEach(() => {
    environmentKeys.forEach((key) => {
      originalEnvironment[key] = process.env[key];
    });
    process.env.NODE_ENV = 'test';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-password';
    process.env.EMAIL_FROM = 'Store <mail@example.com>';
    jest.resetModules();
    nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReset();
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'smtp_123' })
    });
  });

  afterEach(() => {
    environmentKeys.forEach((key) => {
      if (originalEnvironment[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnvironment[key];
      }
    });
  });

  it('sends email through the configured SMTP transporter', async () => {
    const mailer = require('../config/mailer');
    const message = {
      from: 'Store <mail@example.com>',
      to: 'customer@example.com',
      subject: 'Verify your email',
      text: 'Your code is 123456',
      html: '<p>Your code is 123456</p>'
    };

    await expect(mailer.sendMail(message)).resolves.toEqual({
      messageId: 'smtp_123'
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'smtp-user', pass: 'smtp-password' }
      })
    );
    expect(nodemailer.createTransport.mock.results[0].value.sendMail)
      .toHaveBeenCalledWith(message);
  });

  it('requires SMTP credentials in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    jest.resetModules();
    const mailer = require('../config/mailer');

    expect(() => mailer.sendMail({ to: 'customer@example.com' })).toThrow(
      'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.'
    );
  });

  it('reports blocked SMTP on Render when credentials are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-password';
    process.env.RENDER = 'true';
    jest.resetModules();
    const mailer = require('../config/mailer');

    expect(() => mailer.sendMail({ to: 'customer@example.com' })).toThrow(
      'Render blocks outbound SMTP'
    );
  });
});
