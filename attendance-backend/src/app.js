const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const config = require('../config/config');

// Routes
const registerRoutes = require('./routes');

// Utils & Middleware
const { authenticate } = require('./middleware/auth.middleware');

// ================================
// INITIALIZE APP
// ================================
const app = express();
const API_PREFIX = config.server.apiPrefix;

// ================================
// SECURITY
// ================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ================================
// CORS
// ================================
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked origin: ${origin}`);
    return callback(null, true); // dev allow
  },
  credentials: config.cors.credentials,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: config.cors.exposedHeaders,
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  maxAge: config.cors.maxAge
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ================================
// BODY PARSERS
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// LOGGER
// ================================
app.use(
  config.server.env === 'development'
    ? morgan('dev')
    : morgan('combined')
);

// ================================
// STATIC FILES
// ================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ================================
// ROOT
// ================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Attendance Management System API',
    environment: config.server.env,
    timestamp: new Date().toISOString()
  });
});

// ================================
// HEALTH CHECK
// ================================
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    uptime: process.uptime(),
    environment: config.server.env,
    timestamp: new Date().toISOString()
  });
});

// ================================
// REGISTER ROUTES
// ================================
console.log(`📡 Registering routes with prefix: ${API_PREFIX}`);
registerRoutes(app, API_PREFIX);

// ================================
// ADMIN – MANUAL AUTO CHECKOUT
// ================================
app.post(
  `${API_PREFIX}/admin/trigger-auto-checkout`,
  authenticate,
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can trigger auto checkout'
        });
      }

      const { runAutoCheckoutManually } = require('./utils/autoCheckout');
      const result = await runAutoCheckoutManually();

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: { checkedOutCount: result.count }
      });
    } catch (error) {
      console.error('❌ Auto checkout trigger error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger auto checkout',
        error: error.message
      });
    }
  }
);




// ✅ NEW — Monthly Summary Scheduler
const { startScheduler } = require('./utils/Services/schedulerService');
startScheduler();
console.log('✅ Monthly summary scheduler running');

// ================================
// 404 HANDLER
// ================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ================================
// GLOBAL ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.server.env === 'development' && { stack: err.stack })
  });
});

module.exports = app;