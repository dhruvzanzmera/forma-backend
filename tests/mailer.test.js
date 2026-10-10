const environmentKeys = [
  'NODE_ENV',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'SMTP_USER',
  'SMTP_PASS',
  'RENDER',
  'RENDER_SERVICE_ID'
];
const originalEnvironment = {};
let originalFetch;

describe('email delivery configuration', () => {
  beforeEach(() => {
    environmentKeys.forEach((key) => {
      originalEnvironment[key] = process.env[key];
    });
    originalFetch = global.fetch;
    process.env.NODE_ENV = 'test';
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'Store <mail@example.com>';
    global.fetch = jest.fn();
    jest.resetModules();
  });

  afterEach(() => {
    environmentKeys.forEach((key) => {
      if (originalEnvironment[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnvironment[key];
      }
    });
    global.fetch = originalFetch;
  });

  it('sends email through Resend over HTTPS', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 'email_123' })
    });
    const mailer = require('../config/mailer');

    await expect(
      mailer.sendMail({
        from: 'Store <mail@example.com>',
        to: 'customer@example.com',
        subject: 'Verify your email',
        text: 'Your code is 123456',
        html: '<p>Your code is 123456</p>'
      })
    ).resolves.toEqual({ messageId: 'email_123' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          from: 'Store <mail@example.com>',
          to: ['customer@example.com'],
          subject: 'Verify your email',
          text: 'Your code is 123456',
          html: '<p>Your code is 123456</p>'
        })
      })
    );
  });

  it('surfaces Resend API errors to the caller', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Invalid API key' })
    });
    const mailer = require('../config/mailer');

    await expect(
      mailer.sendMail({
        from: 'Store <mail@example.com>',
        to: 'customer@example.com',
        subject: 'Verify your email'
      })
    ).rejects.toThrow('Resend API request failed (401): Invalid API key');
  });

  it('fails explicitly in production when no mail provider is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    jest.resetModules();
    const mailer = require('../config/mailer');

    expect(() => mailer.sendMail({ to: 'customer@example.com' })).toThrow(
      'Email delivery is not configured'
    );
  });

  it('does not try SMTP on Render, even when SMTP credentials are present', () => {
    process.env.NODE_ENV = 'production';
    process.env.RESEND_API_KEY = '';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-password';
    process.env.RENDER = 'true';
    jest.resetModules();
    const mailer = require('../config/mailer');

    expect(() => mailer.sendMail({ to: 'customer@example.com' })).toThrow(
      'Render blocks outbound SMTP'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
