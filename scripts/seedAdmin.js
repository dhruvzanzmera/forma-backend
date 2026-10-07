const mongoose = require('mongoose');
const connectDB = require('../config/db');
const autoSeedAdmin = require('../utils/seedAdmin');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    await autoSeedAdmin();
  } catch (error) {
    console.error('❌ Failed to run seed script:', error.message);
  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
};

run();
