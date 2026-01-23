const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const config = require('./src/config/config');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Connect to Database
connectDB();

// Start Server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`🌟 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`📡 API URL: http://localhost:${PORT}${config.server.apiPrefix}`);
  console.log('🚀 ================================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('🔒 Process terminated!');
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('🔒 Process terminated!');
    process.exit(0);
  });
});

module.exports = server;