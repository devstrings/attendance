const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const config = require('../config/config');

// ✅ Import centralized route registrar
const registerRoutes = require('./routes');

// ================================
// INITIALIZE EXPRESS APP
// ================================
const app = express();

// ================================
// SECURITY MIDDLEWARE
// ================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// ================================
// CORS CONFIGURATION
// ================================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (config.cors.origin.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(null, true); // dev mode allow
    }
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
// BODY PARSER
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// LOGGER
// ================================
if (config.server.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ================================
// STATIC FILES
// ================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ================================
// ROOT ROUTE
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
const API_PREFIX = config.server.apiPrefix;

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
// REGISTER ALL ROUTES (IMPORTANT)
// ================================
console.log(`📡 Registering routes with prefix: ${API_PREFIX}`);
registerRoutes(app, API_PREFIX);

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
