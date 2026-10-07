const request = require('supertest');
const app = require('../app');

describe('Auth Validation & Security Suite', () => {
  it('POST /api/v1/auth/register should fail validation if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('POST /api/v1/auth/register should fail if password is too short', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        password: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    const passwordError = res.body.errors.find((err) => err.field === 'password');
    expect(passwordError).toBeDefined();
    expect(passwordError.message).toContain('at least 6 characters');
  });

  it('POST /api/v1/auth/login should fail validation if email is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email-string',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    const emailError = res.body.errors.find((err) => err.field === 'email');
    expect(emailError).toBeDefined();
  });

  it('POST /api/v1/auth/verify-otp should fail if OTP length is not 6', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: 'test@example.com',
        otp: '123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
