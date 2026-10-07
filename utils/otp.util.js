const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Generate a 6-digit cryptographically secure numeric OTP
 * @returns {string} 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP before saving to database
 * @param {string} otp 
 * @returns {Promise<string>}
 */
const hashOtp = async (otp) => {
  return bcrypt.hash(otp, 10);
};

/**
 * Compare plain OTP with hashed OTP
 * @param {string} plainOtp 
 * @param {string} hashedOtp 
 * @returns {Promise<boolean>}
 */
const compareOtp = async (plainOtp, hashedOtp) => {
  if (!plainOtp || !hashedOtp) return false;
  return bcrypt.compare(plainOtp, hashedOtp);
};

/**
 * Calculate OTP expiration date
 * @param {number} minutes
 * @returns {Date}
 */
const getOtpExpiryDate = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
  getOtpExpiryDate
};
