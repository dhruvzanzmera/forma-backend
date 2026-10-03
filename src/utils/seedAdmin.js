const User = require('../models/user.model');
const config = require('../config/env');
const { UserRole } = require('../constants');

/**
 * Automatically seeds the super admin account on server startup if it doesn't already exist.
 */
const autoSeedAdmin = async () => {
  try {
    const { name, email, password, phone } = config.admin;

    if (!email || !password) {
      console.warn('[Admin Seeder] Warning: ADMIN_EMAIL or ADMIN_PASSWORD is not configured in environment variables.');
      return;
    }

    // Check if admin user already exists with this email
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`[Admin Seeder] Super Admin verified: ${existingAdmin.email} [Role: ${existingAdmin.role}]`);
      return existingAdmin;
    }

    // Create the admin user (userSchema pre-save hook handles bcrypt password hashing)
    const newAdmin = await User.create({
      name: name || 'Super Admin',
      email,
      password,
      phone: phone || '',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true
    });

    console.log('----------------------------------------------------');
    console.log('✅ [Admin Seeder] Super Admin created successfully!');
    console.log(`   Email : ${newAdmin.email}`);
    console.log(`   Role  : ${newAdmin.role}`);
    console.log('----------------------------------------------------');

    return newAdmin;
  } catch (error) {
    console.error('❌ [Admin Seeder] Failed to seed admin user:', error.message);
  }
};

module.exports = autoSeedAdmin;
