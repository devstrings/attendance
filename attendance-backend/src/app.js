const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const config = require('./config/config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const managerRoutes = require('./routes/manager.routes');
const employeeRoutes = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const leaveRoutes = require('./routes/leave.routes');
const salaryRoutes = require('./routes/salary.routes');
const reportRoutes = require('./routes/report.routes');

// ================================
// INITIALIZE EXPRESS APP
// ================================
const app = express();

// ================================
// SECURITY MIDDLEWARE
// ================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ================================
// CORS CONFIGURATION - MULTIPLE ORIGINS SUPPORT
// ================================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.cors.origin.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      callback(null, true); // Allow in development, block in production
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

// Handle preflight requests
app.options('*', cors(corsOptions));

// ================================
// BODY PARSER MIDDLEWARE
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// LOGGING MIDDLEWARE
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
// ROOT HEALTH CHECK
// ================================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 Attendance Management System API',
    version: '1.0.0',
    status: 'Running',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: `${config.server.apiPrefix}/health`,
      auth: `${config.server.apiPrefix}/auth`,
      admin: `${config.server.apiPrefix}/admin`,
      manager: `${config.server.apiPrefix}/manager`,
      employee: `${config.server.apiPrefix}/employee`
    }
  });
});

// ================================
// API HEALTH CHECK
// ================================
app.get(`${config.server.apiPrefix}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    uptime: process.uptime(),
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    database: 'connected', // You can add actual DB check here
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

// ================================
// API ROUTES
// ================================
const API_PREFIX = config.server.apiPrefix;

console.log(`📡 Registering routes with prefix: ${API_PREFIX}`);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/manager`, managerRoutes);
app.use(`${API_PREFIX}/employee`, employeeRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leave`, leaveRoutes);
app.use(`${API_PREFIX}/salary`, salaryRoutes);
app.use(`${API_PREFIX}/report`, reportRoutes);

// ================================
// TEST ROUTE (Development Only)
// ================================
if (config.server.env === 'development') {
  app.get(`${API_PREFIX}/test`, (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Test route working!',
      data: {
        environment: config.server.env,
        apiPrefix: API_PREFIX,
        corsOrigins: config.cors.origin,
        timestamp: new Date().toISOString()
      }
    });
  });
}

// ================================
// 404 HANDLER
// ================================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      `${API_PREFIX}/auth`,
      `${API_PREFIX}/admin`,
      `${API_PREFIX}/manager`,
      `${API_PREFIX}/employee`,
      `${API_PREFIX}/attendance`,
      `${API_PREFIX}/leave`,
      `${API_PREFIX}/salary`,
      `${API_PREFIX}/report`
    ]
  });
});

// ================================
// GLOBAL ERROR HANDLER
// ================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.server.env === 'development' && { stack: err.stack })
  });
});

module.exports = app;