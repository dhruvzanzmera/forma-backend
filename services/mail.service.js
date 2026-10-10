const transporter = require('../config/mailer');
const config = require('../config/env');

const COLORS = {
  ink: '#202823',
  muted: '#777d75',
  paper: '#f8f8f4',
  white: '#ffffff',
  line: '#e4e6df',
  green: '#526b52',
  lime: '#d3ef8d'
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[character];
  });

const formatMoney = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const emailLayout = ({ preheader, eyebrow, title, content, footerNote }) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background-color:${COLORS.paper};font-family:Arial,Helvetica,sans-serif;color:${COLORS.ink};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${COLORS.paper};">
        <tr>
          <td align="center" style="padding:36px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;">
              <tr>
                <td style="background-color:${COLORS.ink};padding:25px 32px;border-radius:14px 14px 0 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="font-family:Arial,Helvetica,sans-serif;font-size:25px;line-height:1;font-weight:800;letter-spacing:2px;color:${COLORS.white};">FORMA<span style="color:${COLORS.lime};">.</span></td>
                      <td align="right" style="font-size:10px;line-height:1.5;letter-spacing:1.4px;text-transform:uppercase;color:#d7ddd5;">Considered goods<br>delivered with care</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="height:4px;background-color:${COLORS.lime};font-size:0;line-height:0;">&nbsp;</td>
              </tr>
              <tr>
                <td style="background-color:${COLORS.white};padding:38px 40px 34px;border-left:1px solid ${COLORS.line};border-right:1px solid ${COLORS.line};">
                  <p style="margin:0 0 12px;font-size:10px;line-height:1.4;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${COLORS.green};">${escapeHtml(eyebrow)}</p>
                  <h1 style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:500;letter-spacing:-.5px;color:${COLORS.ink};">${escapeHtml(title)}</h1>
                  ${content}
                </td>
              </tr>
              <tr>
                <td style="background-color:${COLORS.white};padding:0 40px 30px;border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 14px 14px;">
                  <div style="height:1px;background-color:${COLORS.line};font-size:0;line-height:0;">&nbsp;</div>
                  <p style="margin:20px 0 5px;font-size:13px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(footerNote)}</p>
                  <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.muted};">Thoughtful design, made to stay.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:22px 16px 0;font-size:11px;line-height:1.6;color:${COLORS.muted};">
                  &copy; ${new Date().getFullYear()} Forma Supply Co. &nbsp;|&nbsp; Made for everyday living.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

const paragraph = (content, style = '') =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:${COLORS.ink};${style}">${content}</p>`;

const codeBlock = (code) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:26px 0 20px;">
    <tr>
      <td align="center" style="padding:23px 12px;background-color:${COLORS.paper};border:1px solid ${COLORS.line};border-radius:10px;">
        <span style="font-size:11px;line-height:1.4;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${COLORS.muted};">Your secure code</span><br>
        <span style="display:inline-block;margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:9px;color:${COLORS.green};">${escapeHtml(code)}</span>
      </td>
    </tr>
  </table>
`;

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
    <tr>
      <td bgcolor="${COLORS.ink}" style="border-radius:6px;">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 20px;font-size:13px;font-weight:700;letter-spacing:.3px;color:${COLORS.white};text-decoration:none;">${escapeHtml(label)} &nbsp;&rarr;</a>
      </td>
    </tr>
  </table>
`;

const baseUrl = config.clientUrl.replace(/\/+$/, '');

/**
 * Branded transactional email service. All HTML uses inline styles for email
 * client compatibility and escapes dynamic user/order data before rendering.
 */
class MailService {
  static async sendVerificationOtp(email, name, otp) {
    const safeName = escapeHtml(name || 'there');
    const text = `Hello ${name || 'there'},\n\nWelcome to Forma. Use this code to verify your email address: ${otp}\nIt expires in ${config.business.otpExpireMinutes} minutes. If you did not create a Forma account, you can ignore this message.`;
    const html = emailLayout({
      preheader: `Your Forma verification code is ${otp}. It expires in ${config.business.otpExpireMinutes} minutes.`,
      eyebrow: 'Your Forma account',
      title: 'A better everyday starts here.',
      content: `
        ${paragraph(`Hello <strong>${safeName}</strong>,`)}
        ${paragraph('Thanks for creating a Forma account. Enter this one-time code to confirm your email address:')}
        ${codeBlock(otp)}
        ${paragraph(`This code expires in <strong>${config.business.otpExpireMinutes} minutes</strong>. For your security, never share it with anyone.`)}
      `,
      footerNote: 'Didn’t create an account? You can safely ignore this email.'
    });

    return transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Your Forma email verification code',
      text,
      html
    });
  }

  static async sendPasswordResetOtp(email, name, otp) {
    const safeName = escapeHtml(name || 'there');
    const text = `Hello ${name || 'there'},\n\nWe received a request to reset your Forma password. Use this code to continue: ${otp}\nIt expires in ${config.business.otpExpireMinutes} minutes. If you did not request this, no action is needed.`;
    const html = emailLayout({
      preheader: `Use this secure code to reset your Forma password. It expires in ${config.business.otpExpireMinutes} minutes.`,
      eyebrow: 'Account security',
      title: 'Let’s get you back in.',
      content: `
        ${paragraph(`Hello <strong>${safeName}</strong>,`)}
        ${paragraph('We received a request to reset the password for your Forma account. Use this one-time code to continue:')}
        ${codeBlock(otp)}
        ${paragraph(`This code expires in <strong>${config.business.otpExpireMinutes} minutes</strong> and can only be used once.`)}
      `,
      footerNote: 'If you didn’t request a password reset, you can ignore this email. Your password will remain unchanged.'
    });

    return transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Your Forma password reset code',
      text,
      html
    });
  }

  static async sendPasswordChangedNotification(email, name) {
    const safeName = escapeHtml(name || 'there');
    const text = `Hello ${name || 'there'},\n\nThe password for your Forma account has been changed. If this was you, no further action is needed. If you did not make this change, secure your account immediately at ${baseUrl}/forgot-password.`;
    const html = emailLayout({
      preheader: 'Your Forma account password was changed.',
      eyebrow: 'Security notification',
      title: 'Your password was updated.',
      content: `
        ${paragraph(`Hello <strong>${safeName}</strong>,`)}
        ${paragraph('This is a confirmation that the password for your Forma account was successfully changed.')}
        ${paragraph('<strong>Wasn’t you?</strong> Please reset your password right away to protect your account.')}
        ${button(`${baseUrl}/forgot-password`, 'Secure your account')}
      `,
      footerNote: 'If you made this change, you can safely disregard this security notice.'
    });

    return transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'Security notice: your Forma password was changed',
      text,
      html
    });
  }

  static async sendOrderConfirmation(order, user) {
    const safeName = escapeHtml(user.name || 'there');
    const safeOrderNumber = escapeHtml(order.orderNumber);
    const itemsHtml = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:13px 10px 13px 0;border-bottom:1px solid ${COLORS.line};font-size:13px;line-height:1.5;color:${COLORS.ink};">${escapeHtml(item.name)}</td>
            <td align="center" style="padding:13px 8px;border-bottom:1px solid ${COLORS.line};font-size:13px;color:${COLORS.muted};">${escapeHtml(item.quantity)}</td>
            <td align="right" style="padding:13px 0 13px 8px;border-bottom:1px solid ${COLORS.line};font-size:13px;color:${COLORS.ink};">${formatMoney(item.subtotal)}</td>
          </tr>`
      )
      .join('');
    const address = order.shippingAddress;
    const safeAddress = [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country
    ]
      .filter(Boolean)
      .map(escapeHtml)
      .join(', ');
    const text = `Hello ${user.name || 'there'},\n\nThanks for choosing Forma. Your order #${order.orderNumber} is confirmed and will be prepared with care.\n\n${order.items.map((item) => `${item.name} × ${item.quantity}: ${formatMoney(item.subtotal)}`).join('\n')}\n\nItems: ${formatMoney(order.itemsPrice)}\nTax: ${formatMoney(order.taxPrice)}\nDelivery: ${formatMoney(order.shippingPrice)}\nTotal: ${formatMoney(order.totalPrice)}\nPayment: Cash on Delivery\nDelivery address: ${address.street}, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
    const html = emailLayout({
      preheader: `Order ${order.orderNumber} is confirmed. Thanks for choosing Forma.`,
      eyebrow: 'Order received',
      title: 'Good choice. It’s on its way.',
      content: `
        ${paragraph(`Hello <strong>${safeName}</strong>,`)}
        ${paragraph(`Thanks for choosing Forma. We’ve received your order and will keep you updated as it moves along.`)}
        <div style="margin:23px 0;padding:15px 17px;background-color:${COLORS.paper};border-left:3px solid ${COLORS.green};">
          <span style="font-size:10px;line-height:1.4;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.muted};">Order number</span><br>
          <strong style="display:inline-block;margin-top:5px;font-size:15px;color:${COLORS.ink};">#${safeOrderNumber}</strong>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:24px 0 16px;">
          <thead>
            <tr>
              <th align="left" style="padding:0 10px 10px 0;border-bottom:1px solid ${COLORS.line};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};">Item</th>
              <th align="center" style="padding:0 8px 10px;border-bottom:1px solid ${COLORS.line};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};">Qty</th>
              <th align="right" style="padding:0 0 10px 8px;border-bottom:1px solid ${COLORS.line};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${COLORS.muted};">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 24px;">
          <tr><td style="padding:5px 0;font-size:13px;color:${COLORS.muted};">Items</td><td align="right" style="padding:5px 0;font-size:13px;color:${COLORS.ink};">${formatMoney(order.itemsPrice)}</td></tr>
          <tr><td style="padding:5px 0;font-size:13px;color:${COLORS.muted};">Tax</td><td align="right" style="padding:5px 0;font-size:13px;color:${COLORS.ink};">${formatMoney(order.taxPrice)}</td></tr>
          <tr><td style="padding:5px 0;font-size:13px;color:${COLORS.muted};">Delivery</td><td align="right" style="padding:5px 0;font-size:13px;color:${COLORS.ink};">${formatMoney(order.shippingPrice)}</td></tr>
          <tr><td style="padding:13px 0 0;border-top:1px solid ${COLORS.line};font-size:15px;font-weight:700;color:${COLORS.ink};">Total</td><td align="right" style="padding:13px 0 0;border-top:1px solid ${COLORS.line};font-size:15px;font-weight:700;color:${COLORS.green};">${formatMoney(order.totalPrice)}</td></tr>
        </table>
        <div style="padding:16px 18px;background-color:${COLORS.paper};border-radius:8px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${COLORS.green};">Delivery details</p>
          <p style="margin:0 0 5px;font-size:13px;line-height:1.6;color:${COLORS.ink};">${safeAddress}</p>
          <p style="margin:0;font-size:12px;color:${COLORS.muted};">Payment: Cash on Delivery</p>
        </div>
        ${button(`${baseUrl}/orders`, 'View your orders')}
      `,
      footerNote: 'We’ll send you another note when your order status changes.'
    });

    return transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: `Order ${order.orderNumber} is confirmed | Forma`,
      text,
      html
    });
  }

  static async sendOrderStatusUpdate(order, user) {
    const safeName = escapeHtml(user.name || 'there');
    const safeOrderNumber = escapeHtml(order.orderNumber);
    const safeStatus = escapeHtml(
      String(order.orderStatus || '').replace(/_/g, ' ').toLowerCase()
    );
    const safePaymentStatus = escapeHtml(
      String(order.paymentStatus || '').replace(/_/g, ' ').toLowerCase()
    );
    const cancellation = order.cancellationReason
      ? `<p style="margin:15px 0 0;font-size:13px;line-height:1.6;color:${COLORS.muted};"><strong style="color:${COLORS.ink};">Note:</strong> ${escapeHtml(order.cancellationReason)}</p>`
      : '';
    const text = `Hello ${user.name || 'there'},\n\nThe status of your Forma order #${order.orderNumber} has been updated to ${String(order.orderStatus || '').replace(/_/g, ' ').toLowerCase()}.\nPayment status: ${String(order.paymentStatus || '').replace(/_/g, ' ').toLowerCase()}${order.cancellationReason ? `\nNote: ${order.cancellationReason}` : ''}\n\nView your orders: ${baseUrl}/orders`;
    const html = emailLayout({
      preheader: `An update on Forma order ${order.orderNumber}: ${String(order.orderStatus || '').replace(/_/g, ' ').toLowerCase()}.`,
      eyebrow: 'Order update',
      title: 'Your order is moving along.',
      content: `
        ${paragraph(`Hello <strong>${safeName}</strong>,`)}
        ${paragraph(`Here’s the latest on order <strong>#${safeOrderNumber}</strong>.`)}
        <div style="margin:23px 0;padding:19px 20px;background-color:${COLORS.paper};border-left:3px solid ${COLORS.green};">
          <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${COLORS.muted};">Current status</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:23px;text-transform:capitalize;color:${COLORS.green};">${safeStatus}</p>
        </div>
        ${paragraph(`Payment status: <strong style="text-transform:capitalize;">${safePaymentStatus}</strong>`)}
        ${cancellation}
        ${button(`${baseUrl}/orders`, 'View your orders')}
      `,
      footerNote: 'Thank you for choosing Forma. We appreciate you.'
    });

    return transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: `Order ${order.orderNumber} update | Forma`,
      text,
      html
    });
  }
}

module.exports = MailService;
