require('dotenv').config();

const config = {
  // ================================
  // SERVER CONFIGURATION
  // ================================
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1'
  },

  // ================================
  // DATABASE CONFIGURATION
  // ================================
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // ================================
  // JWT CONFIGURATION
  // ================================
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // ================================
  // EMAIL CONFIGURATION
  // ================================
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Attendance System',
    fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },

  // ================================
  // FRONTEND CONFIGURATION
  // ================================
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // ================================
  // CORS CONFIGURATION - MULTIPLE ORIGINS SUPPORT
  // ================================
  cors: {
    origin: [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'http://localhost:3001', // Support for port 3001 bhi
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
  },

  // ================================
  // FILE UPLOAD CONFIGURATION
  // ================================
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads/'
  },

  // ================================
  // PAGINATION CONFIGURATION
  // ================================
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },

  // ================================
  // PASSWORD CONFIGURATION
  // ================================
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
  },

  // ================================
  // OTP CONFIGURATION
  // ================================
  otp: {
    length: parseInt(process.env.OTP_LENGTH) || 6,
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
  },

  // ================================
  // ATTENDANCE CONFIGURATION
  // ================================
  attendance: {
    gracePeriodMinutes: parseInt(process.env.GRACE_PERIOD_MINUTES) || 15,
    standardWorkHours: parseInt(process.env.STANDARD_WORK_HOURS) || 8,
    overtimeRate: parseFloat(process.env.OVERTIME_RATE) || 1.5
  },

  // ================================
  // LEAVE CONFIGURATION
  // ================================
  leave: {
    types: ['sick', 'casual', 'annual', 'unpaid', 'emergency', 'maternity', 'paternity'],
    annualLeaveEntitlement: parseInt(process.env.ANNUAL_LEAVE_ENTITLEMENT) || 21,
    sickLeaveEntitlement: parseInt(process.env.SICK_LEAVE_ENTITLEMENT) || 10,
    casualLeaveEntitlement: parseInt(process.env.CASUAL_LEAVE_ENTITLEMENT) || 10,
    emergencyLeaveEntitlement: parseInt(process.env.EMERGENCY_LEAVE_ENTITLEMENT) || 5
  },

  // ================================
  // SALARY CONFIGURATION
  // ================================
  salary: {
    minimumSalary: parseInt(process.env.MINIMUM_SALARY) || 10000,
    currency: process.env.CURRENCY || 'PKR',
    paymentMethods: ['bank-transfer', 'cash', 'cheque']
  },

  // ================================
  // RATE LIMITING
  // ================================
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};

// ================================
// VALIDATE REQUIRED ENV VARIABLES
// ================================
const validateConfig = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET'
  ];

  const recommended = [
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];

  // Check required
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing REQUIRED environment variables:', missing.join(', '));
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Cannot start in production without required variables');
      process.exit(1);
    } else {
      console.warn('⚠️  Development mode: Using default values');
    }
  }

  // Check recommended
  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing RECOMMENDED environment variables:', missingRecommended.join(', '));
    console.warn('💡 Some features (like email) may not work properly');
  }

  // Success message
  if (missing.length === 0 && missingRecommended.length === 0) {
    console.log('✅ All environment variables configured');
  }
};

// Run validation
validateConfig();

module.exports = config;