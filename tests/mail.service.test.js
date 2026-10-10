jest.mock('../config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message' })
}));

const transporter = require('../config/mailer');
const MailService = require('../services/mail.service');

describe('Forma transactional email templates', () => {
  beforeEach(() => {
    transporter.sendMail.mockClear();
  });

  it('uses the storefront branding and escapes dynamic verification content', async () => {
    await MailService.sendVerificationOtp(
      'customer@example.com',
      '<script>alert("name")</script>',
      '123456'
    );
    const message = transporter.sendMail.mock.calls[0][0];

    expect(message.subject).toBe('Your Forma email verification code');
    expect(message.html).toContain('FORMA<span');
    expect(message.html).toContain('#202823');
    expect(message.html).toContain('#f8f8f4');
    expect(message.html).toContain('#d3ef8d');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.html).not.toContain('<script>alert');
    expect(message.text).toContain('123456');
  });

  it('formats order emails in INR and escapes customer and item content', async () => {
    const order = {
      orderNumber: 'FM-1001',
      items: [
        {
          name: '<img src=x onerror=alert(1)>',
          quantity: 2,
          subtotal: 1998
        }
      ],
      itemsPrice: 1998,
      taxPrice: 100,
      shippingPrice: 0,
      totalPrice: 2098,
      shippingAddress: {
        street: '1 Main Street',
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'India'
      }
    };

    await MailService.sendOrderConfirmation(order, {
      name: '<b>Customer</b>',
      email: 'customer@example.com'
    });
    const message = transporter.sendMail.mock.calls[0][0];

    expect(message.subject).toContain('FM-1001');
    expect(message.html).toContain('&lt;b&gt;Customer&lt;/b&gt;');
    expect(message.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(message.html).not.toContain('<img src=x');
    expect(message.html).toContain('₹1,998');
    expect(message.html).toContain('₹2,098');
    expect(message.html).toContain('View your orders');
  });

  it('uses the same branded shell for password and order status notifications', async () => {
    await MailService.sendPasswordResetOtp('customer@example.com', 'Ari', '654321');
    await MailService.sendPasswordChangedNotification('customer@example.com', 'Ari');
    await MailService.sendOrderStatusUpdate(
      {
        orderNumber: 'FM-1002',
        orderStatus: 'OUT_FOR_DELIVERY',
        paymentStatus: 'PENDING'
      },
      { name: 'Ari', email: 'customer@example.com' }
    );

    const messages = transporter.sendMail.mock.calls.map(([message]) => message);
    expect(messages).toHaveLength(3);
    messages.forEach((message) => {
      expect(message.html).toContain('FORMA<span');
      expect(message.html).toContain('Thoughtful design, made to stay.');
      expect(message.html).toContain('#202823');
    });
    expect(messages[0].html).toContain('654321');
    expect(messages[2].html).toContain('out for delivery');
  });
});
