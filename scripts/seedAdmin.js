const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const connectDB = require('../src/config/db');
const config = require('../src/config/env');
const { UserRole } = require('../src/constants');

const seedAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const { name, email, password, phone } = config.admin;

    console.log(`Checking if admin (${email}) exists...`);
    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`[SEED INFO] Admin user already exists with email: ${email}`);
      console.log(`Role: ${admin.role}, Verified: ${admin.isEmailVerified}, Active: ${admin.isActive}`);
    } else {
      admin = await User.create({
        name,
        email,
        password,
        phone: phone || '',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        isActive: true
      });

      console.log('----------------------------------------------------');
      console.log('✅ Admin user created successfully!');
      console.log(`Email    : ${admin.email}`);
      console.log(`Password : ${password}`);
      console.log(`Role     : ${admin.role}`);
      console.log('----------------------------------------------------');
    }

    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error.message);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
