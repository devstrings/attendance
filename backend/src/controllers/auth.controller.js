const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const { generateToken } = require('../utils/jwtHandler');
const { hashPassword, comparePassword } = require('../utils/passwordHandler');
const { generateOTP, verifyOTP } = require('../utils/otpHandler');
const { sendOTPEmail } = require('../utils/emailService');
const { validateEmail, validatePassword } = require('../utils/validators');

/**
 * Login User - FIXED VERSION
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email:', email);
    console.log('🔑 Password received:', password ? 'Yes' : 'No');

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log('👤 User found in DB:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    console.log('📋 User details:');
    console.log('   - ID:', user._id);
    console.log('   - Email:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Active:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is deactivated');
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Compare password
    console.log('🔐 Starting password comparison...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password comparison result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    console.log('✅ Password validated successfully');

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    console.log('✅ Last login updated');

    // Generate token
    const token = generateToken(user._id, user.role);
    console.log('✅ Token generated');

    // Get user profile based on role
    let userProfile = null;
    if (user.role === 'employee') {
      userProfile = await Employee.findOne({ userId: user._id })
        .populate('managerId', 'firstName lastName email');
      console.log('👤 Employee profile loaded');
    } else if (user.role === 'manager') {
      userProfile = await Manager.findOne({ userId: user._id })
        .populate('employeesUnder', 'firstName lastName email');
      console.log('👤 Manager profile loaded');
    }

    // ✅ FIXED: Correct response structure for frontend
    const responseData = {
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,           // ✅ Changed from userId to id
          email: user.email,
          role: user.role,        // ✅ Role directly accessible
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          profile: userProfile
        }
      }
    };

    console.log('✅ ===== LOGIN SUCCESSFUL =====');
    console.log('📦 Response structure:', JSON.stringify({
      success: responseData.success,
      hasToken: !!responseData.data.token,
      userRole: responseData.data.user.role
    }, null, 2));

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ ===== LOGIN ERROR =====');
    console.error('Error details:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
};

/**
 * Forgot Password - Send OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered in our system.'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpiry;
    await user.save();

    // ✅ sendOTPEmail use karo (better template + name bhi pass hoga)
    try {
      await sendOTPEmail({
        to: user.email,
        otp: otp,
        name: user.name || user.email  // name field jo bhi ho User model mein
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email.',
        error: emailError.message  // ab actual reason frontend/terminal mein dikhega
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email.',
      data: { email: user.email }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP.',
      error: error.message
    });
  }
};

/**
 * Verify OTP
 */
const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if OTP exists and not expired
    if (!user.otp || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }

    // Generate password reset token
    const resetToken = generateToken(user._id, user.role, '15m');

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      data: {
        resetToken,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed.',
      error: error.message
    });
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed.',
      error: error.message
    });
  }
};

/**
 * Change Password (for logged in users)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, oldPassword, newPassword, password, confirmPassword } = req.body;
const currentPass = currentPassword || oldPassword;
const newPass = newPassword || password;
    const userId = req.user.userId;

    // Validate input
    if (!currentPass || !newPass || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    // Check if passwords match
    if (newPass !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPass);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Verify current password
   const isPasswordValid = await user.comparePassword(currentPass);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Check if new password is same as old
    const isSamePassword = await user.comparePassword(newPass);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password.'
      });
    }

    // Update password
    user.password = newPass;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed.',
      error: error.message
    });
  }
};

/**
 * Get Current User
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get user profile based on role
    let userProfile = null;
    if (user.role === 'employee') {
      userProfile = await Employee.findOne({ userId: user._id })
        .populate('managerId', 'firstName lastName email');
    } else if (user.role === 'manager') {
      userProfile = await Manager.findOne({ userId: user._id })
        .populate('employeesUnder', 'firstName lastName email');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile: userProfile
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data.',
      error: error.message
    });
  }
};

/**
 * Logout (client-side token removal, optional backend tracking)
 */
const logout = async (req, res) => {
  try {
    // You can add logout tracking here if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOTPController,
  resetPassword,
  changePassword,
  getCurrentUser,
  logout
};