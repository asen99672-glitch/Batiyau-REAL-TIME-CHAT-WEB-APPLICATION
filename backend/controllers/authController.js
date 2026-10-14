import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SystemSetting from '../models/SystemSetting.js';
import SecurityEvent from '../models/SecurityEvent.js';

// JWT token generate helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Helper to extract device info
const extractDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').replace(/^.*:/, '') || '127.0.0.1';

  let device = 'Windows PC';
  let browser = 'Chrome';

  if (userAgent.includes('iPhone')) {
    device = 'iPhone';
    browser = 'Safari Mobile';
  } else if (userAgent.includes('Android')) {
    device = 'Android Device';
    browser = 'Chrome Mobile';
  } else if (userAgent.includes('Macintosh')) {
    device = 'MacBook / Mac';
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }

  return { device, browser, ip, userAgent };
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, username, email, password, phoneNumber } = req.body;

    // Check system settings: Is registration enabled?
    const settings = await SystemSetting.findOne({ key: 'global_settings' });
    if (settings && settings.allowNewRegistrations === false) {
      return res.status(403).json({
        message: 'New user registrations are temporarily suspended by the administrator.',
      });
    }

    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const { device, browser, ip } = extractDeviceInfo(req);

    const user = await User.create({
      name,
      username,
      email,
      password,
      phoneNumber: phoneNumber || '',
      loginSessions: [
        {
          device,
          browser,
          ip,
          lastActive: new Date(),
          current: true,
        },
      ],
      devices: [
        {
          deviceId: 'dev_' + Date.now(),
          name: `${device} - ${browser}`,
          type: device.includes('Phone') || device.includes('Android') ? 'mobile' : 'web',
          lastActive: new Date(),
        },
      ],
    });

    if (user) {
      const io = req.app.get('io');
      if (io) {
        io.emit('userRegistered', {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          profilePicture: user.profilePicture,
          status: user.status,
          createdAt: user.createdAt,
          role: user.role,
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture,
        bio: user.bio,
        status: user.status,
        role: user.role || 'user',
        isBanned: user.isBanned || false,
        isSuspended: user.isSuspended || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, twoFactorPin } = req.body;
    const { device, browser, ip } = extractDeviceInfo(req);

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
    }).select('+password');

    if (!user) {
      // Record failed login event
      await SecurityEvent.create({
        type: 'failed_login',
        userIdentifier: email,
        ip,
        device,
        browser,
        details: 'Attempted login with non-existent account',
        severity: 'medium',
      });
      return res.status(401).json({ message: 'Invalid credentials provided' });
    }

    // Check account deletion
    if (user.isDeleted) {
      return res.status(403).json({
        message: 'Your account has been deleted or deactivated. Please contact support.',
        isDeleted: true,
      });
    }

    // Check account ban / block
    if (user.isBanned) {
      if (user.blockType === 'temporary' && user.blockExpiryDate && new Date(user.blockExpiryDate) <= new Date()) {
        user.isBanned = false;
        user.blockExpiryDate = null;
        user.blockHistory.push({
          action: 'unblock',
          reason: 'Temporary block duration expired automatically',
          adminName: 'System (Auto-expiry)',
          createdAt: new Date(),
        });
        await user.save();
      } else {
        return res.status(403).json({
          message: user.banReason
            ? `Account blocked: ${user.banReason}`
            : 'Your account has been blocked by an administrator.',
          isBanned: true,
          blockType: user.blockType || 'permanent',
          blockExpiryDate: user.blockExpiryDate,
        });
      }
    }

    // Check account suspension
    if (user.isSuspended) {
      if (user.suspendedUntil && new Date(user.suspendedUntil) <= new Date()) {
        user.isSuspended = false;
        user.suspendedUntil = null;
        user.suspensionHistory.push({
          action: 'activate',
          reason: 'Suspension period concluded automatically',
          adminName: 'System (Auto-expiry)',
          createdAt: new Date(),
        });
        await user.save();
      } else {
        return res.status(403).json({
          message: user.suspendReason
            ? `Account temporarily suspended: ${user.suspendReason}`
            : 'Your account is temporarily suspended by moderation.',
          isSuspended: true,
          suspendedUntil: user.suspendedUntil,
        });
      }
    }

    // Verify Password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await SecurityEvent.create({
        type: 'failed_login',
        user: user._id,
        userIdentifier: user.email,
        ip,
        device,
        browser,
        details: 'Incorrect password attempt',
        severity: 'high',
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('securityAlert', {
          title: 'Failed Login Attempt',
          details: `Failed password for ${user.email} from IP ${ip}`,
          timestamp: new Date(),
        });
      }

      return res.status(401).json({ message: 'Invalid credentials provided' });
    }

    // Check 2FA if enabled
    if (user.accountSecurity?.twoStepVerification?.enabled) {
      if (!twoFactorPin) {
        return res.status(200).json({
          requires2FA: true,
          userId: user._id,
          message: 'Two-Factor Authentication PIN required',
        });
      }

      if (user.accountSecurity.twoStepVerification.pin !== twoFactorPin) {
        await SecurityEvent.create({
          type: 'failed_login',
          user: user._id,
          userIdentifier: user.email,
          ip,
          device,
          browser,
          details: 'Invalid 2FA security PIN entered',
          severity: 'high',
        });
        return res.status(401).json({ message: 'Invalid 2FA PIN entered' });
      }
    }

    // User is authorized
    user.status = 'online';
    user.lastSeen = Date.now();
    user.lastLogin = new Date();

    // Add session
    user.loginSessions = user.loginSessions || [];
    user.loginSessions.unshift({
      device,
      browser,
      ip,
      lastActive: new Date(),
      current: true,
    });
    if (user.loginSessions.length > 5) user.loginSessions.pop();

    await user.save({ validateBeforeSave: false });

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      profilePicture: user.profilePicture,
      bio: user.bio,
      status: user.status,
      role: user.role || 'user',
      publicKey: user.publicKey,
      isBanned: user.isBanned || false,
      isSuspended: user.isSuspended || false,
      accountSecurity: user.accountSecurity,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastSeen: Date.now(),
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.json(req.user);
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email' });
    }

    // Generate a temporary 6-digit OTP reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Password reset verification code generated for ${email}`,
      demoCode: resetCode, // For demo/testing convenience
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process forgot password request' });
  }
};

// @desc    Reset Password with Code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordToken !== code) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await SecurityEvent.create({
      type: 'password_changed',
      user: user._id,
      userIdentifier: user.email,
      details: 'Password was reset via verification code',
      severity: 'medium',
    });

    res.json({
      success: true,
      message: 'Password successfully updated. You can now log in with your new password.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

export { register, login, logout, getMe, forgotPassword, resetPassword };
