require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api/v1'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: '7d',
    refreshExpiresIn: '30d'
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Attendance System',
    fromEmail: process.env.EMAIL_USER
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // CORS Configuration - ✅ FIXED
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Ab 3000 pe set hai
    credentials: true
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    uploadDir: 'uploads/'
  },

  // Pagination Configuration
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  },

  // Password Configuration
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },

  // OTP Configuration
  otp: {
    length: 6,
    expiryMinutes: 10
  },

  // Attendance Configuration
  attendance: {
    gracePeriodMinutes: 15,
    standardWorkHours: 8,
    overtimeRate: 1.5
  },

  // Leave Configuration
  leave: {
    types: ['sick', 'casual', 'annual', 'unpaid', 'emergency', 'maternity', 'paternity'],
    annualLeaveEntitlement: 21,
    sickLeaveEntitlement: 10,
    casualLeaveEntitlement: 10,
    emergencyLeaveEntitlement: 5
  },

  // Salary Configuration
  salary: {
    minimumSalary: 10000,
    currency: 'PKR',
    paymentMethods: ['bank-transfer', 'cash', 'cheque']
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

// Validate required environment variables
const validateConfig = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

validateConfig();

module.exports = config;