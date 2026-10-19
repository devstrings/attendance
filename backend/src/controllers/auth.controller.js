const User = require('../models/User');
const Employee = require('../models/Employee');
const Manager = require('../models/Manager');
const { generateToken } = require('../utils/jwtHandler');
const { hashPassword, comparePassword } = require('../utils/passwordHandler');
const { generateOTP, verifyOTP } = require('../utils/otpHandler');
const { sendOTPEmail } = require('../utils/emailService');
const { validateEmail, validatePassword } = require('../utils/validators');
const Company = require('../models/Company');

/**
 * Login User
 */
const login = async (req, res) => {
  try {
    const { email, password, companyCode } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.'
      });
    }

    // Company resolve karo (agar companyCode diya gaya)
    let resolvedCompanyId = undefined; // undefined = filter nahi (superadmin / worker / legacy)
    if (companyCode && companyCode.trim() !== '') {
      const company = await Company.findOne({ companyCode: companyCode.trim().toUpperCase() });
      if (!company) {
        return res.status(401).json({
          success: false,
          message: 'Invalid company code, email, or password.'
        });
      }
      if (!company.isActive) {
        return res.status(403).json({
          success: false,
          message: 'This company account has been suspended. Please contact support.'
        });
      }
      resolvedCompanyId = company._id;
    }

    // User dhoondo
    const user = resolvedCompanyId
      ? await User.findOne({ email: email.toLowerCase(), companyId: resolvedCompanyId })
      : await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Password check
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Deactivated user login na kar sake
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Company info (URL slug ke liye)
    let companyInfo = null;
    if (user.companyId) {
      const company = await Company.findById(user.companyId).select('companyName slug companyCode');
      if (company) {
        companyInfo = { companyName: company.companyName, slug: company.slug, companyCode: company.companyCode };
      }
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Role ke hisaab se profile
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
      message: 'Login successful.',
      data: {
        token,
        company: companyInfo,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions || [],
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          profile: userProfile
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed.'
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

    try {
      await sendOTPEmail({
        to: user.email,
        otp: otp,
        name: user.name || user.email
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email.',
        error: emailError.message
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

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

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

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }

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
 * Reset Password (✅ ab OTP lazmi hai)
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and passwords are required.'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Ek hi message, taake pata na chale email maujood hai ya nahi
    const invalidOtpResponse = () =>
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.'
      });

    if (!user || !user.otp || !user.otpExpires) return invalidOtpResponse();
    if (new Date() > user.otpExpires) return invalidOtpResponse();
    if (user.otp !== String(otp)) return invalidOtpResponse();

    user.password = newPassword;
    user.otp = undefined;          // OTP sirf ek dafa chalta hai
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Password reset failed.'
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

    if (!currentPass || !newPass || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.'
      });
    }

    if (newPass !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match.'
      });
    }

    const passwordValidation = validatePassword(newPass);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPass);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    const isSamePassword = await user.comparePassword(newPass);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password.'
      });
    }

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
 * Logout (client-side token removal)
 */
const logout = async (req, res) => {
  try {
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