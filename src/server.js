const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
  process.exit(1);
});

let server;

// Start Server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(`  E-Commerce API Server Running                `);
      console.log(`  Environment: ${config.env}                   `);
      console.log(`  Port       : ${config.port}                  `);
      console.log(`  Health URL : http://localhost:${config.port}/api/v1/health `);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('[Server Startup Error]', error.message);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  if (server) {
    server.close(() => {
      console.log('Process terminated.');
      process.exit(0);
    });
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
