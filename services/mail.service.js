const transporter = require('../config/mailer');
const config = require('../config/env');

/**
 * Mail Service for transactional and notification emails
 */
class MailService {
  /**
   * Send Email Verification OTP
   */
  static async sendVerificationOtp(email, name, otp) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Verify Your Email Address - E-Commerce Store',
      text: `Hello ${name},\n\nYour email verification OTP is: ${otp}\nThis code will expire in ${config.business.otpExpireMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for registering with our store. Please use the verification code below to verify your email address:</p>
          <div style="background-color: #f4f6f8; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>${config.business.otpExpireMinutes} minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send Password Reset OTP
   */
  static async sendPasswordResetOtp(email, name, otp) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Password Reset Request - E-Commerce Store',
      text: `Hello ${name},\n\nYour password reset OTP is: ${otp}\nThis code is valid for ${config.business.otpExpireMinutes} minutes.\n\nIf you did not request a password reset, please secure your account immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We received a request to reset your password. Use the verification code below to set a new password:</p>
          <div style="background-color: #f4f6f8; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code is valid for <strong>${config.business.otpExpireMinutes} minutes</strong>.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you did not make this request, please change your password or contact our support team immediately.</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send Password Changed Notification
   */
  static async sendPasswordChangedNotification(email, name) {
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Security Alert: Password Changed - E-Commerce Store',
      text: `Hello ${name},\n\nThis is a confirmation that your account password was successfully updated.\nIf you did not perform this change, please contact our support team immediately.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Password Changed Successfully</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your password was recently changed. If you initiated this request, no further action is required.</p>
          <p style="color: #dc2626; font-weight: bold;">If you did not make this change, please contact support immediately to lock your account.</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send Order Confirmation Email
   */
  static async sendOrderConfirmation(order, user) {
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.subtotal.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const mailOptions = {
      from: config.email.from,
      to: user.email,
      subject: `Order Confirmation #${order.orderNumber} - E-Commerce Store`,
      text: `Thank you for your order! Your order #${order.orderNumber} has been placed successfully via Cash on Delivery. Total: $${order.totalPrice.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 8px;">Order Confirmed!</h2>
          <p>Thank you for shopping with us, <strong>${user.name}</strong>.</p>
          <p>Your order <strong>#${order.orderNumber}</strong> has been received and will be processed soon.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8fafc; text-align: left;">
                <th style="padding: 10px; border-bottom: 2px solid #ddd;">Product</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: center;">Qty</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                <th style="padding: 10px; border-bottom: 2px solid #ddd; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; margin-top: 15px;">
            <p style="margin: 4px 0;">Items Subtotal: <strong>$${order.itemsPrice.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">Tax: <strong>$${order.taxPrice.toFixed(2)}</strong></p>
            <p style="margin: 4px 0;">Shipping: <strong>$${order.shippingPrice.toFixed(2)}</strong></p>
            <h3 style="margin: 10px 0; color: #1e293b;">Total: $${order.totalPrice.toFixed(2)}</h3>
          </div>

          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;"><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
            <p style="margin: 4px 0 0; font-size: 14px;"><strong>Delivery Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}</p>
          </div>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }

  /**
   * Send Order Status Update Notification
   */
  static async sendOrderStatusUpdate(order, user) {
    const mailOptions = {
      from: config.email.from,
      to: user.email,
      subject: `Order #${order.orderNumber} Status Updated: ${order.orderStatus}`,
      text: `Hello ${user.name},\n\nThe status of your order #${order.orderNumber} has been updated to: ${order.orderStatus}.\nPayment Status: ${order.paymentStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Order Status Update</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your order <strong>#${order.orderNumber}</strong> status is now:</p>
          <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 18px; margin: 20px 0;">
            <span style="font-size: 18px; font-weight: bold; color: #1e40af;">${order.orderStatus}</span>
          </div>
          <p>Payment Status: <strong>${order.paymentStatus}</strong></p>
          ${order.cancellationReason ? `<p style="color: #dc2626;">Reason: ${order.cancellationReason}</p>` : ''}
          <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Thank you for choosing our store!</p>
        </div>
      `
    };

    return transporter.sendMail(mailOptions);
  }
}

module.exports = MailService;
