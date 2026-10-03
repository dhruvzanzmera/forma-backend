const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./env');

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably (prevents querySrv ECONNREFUSED)
if (config.mongoUri && config.mongoUri.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  } catch (err) {
    console.warn('[Database] Custom DNS config note:', err.message);
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Exit process with failure in production, throw in tests
    if (config.env !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database Error]', err);
});

module.exports = connectDB;
