const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ─── Register User ────────────────────────────────────────────────────────────
// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    phone: phone || '',
    address: address || '',
    role: 'user',
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid user data');
  }

  // Create welcome notification
  await Notification.createNotification({
    recipient: user._id,
    title: 'Welcome to Complaint System!',
    message: `Hello ${user.name}, your account has been created successfully. You can now submit complaints.`,
    type: 'general',
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

// ─── Login User ───────────────────────────────────────────────────────────────
// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      department: user.department,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    },
  });
});

// ─── Get Current User ─────────────────────────────────────────────────────────
// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, department } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Update fields
  if (name)       user.name       = name.trim();
  if (phone)      user.phone      = phone.trim();
  if (address)    user.address    = address.trim();
  if (department) user.department = department.trim();

  // Handle avatar upload
  if (req.file) {
    // Delete old avatar if exists
    if (user.avatar) {
      const { deleteFile } = require('../middleware/uploadMiddleware');
      deleteFile(user.avatar);
    }
    user.avatar = req.file.filename;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

// ─── Change Password ──────────────────────────────────────────────────────────
// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide current and new password');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide your email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if email exists or not
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken  = hashedToken;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  // In production, send email. For now, return token in response (dev mode)
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  // Try to send email if nodemailer is configured
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Complaint System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" style="background:#3B82F6;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Reset Password
        </a>
        <p>This link expires in 30 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  } catch (emailError) {
    console.log('Email not sent (check EMAIL config):', emailError.message);
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
    // Only expose in development
    ...(process.env.NODE_ENV === 'development' && { resetUrl }),
  });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
// PUT /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the incoming token to compare with stored one
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Set new password
  const salt = await bcrypt.genSalt(10);
  user.password            = await bcrypt.hash(password, salt);
  user.resetPasswordToken  = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now log in.',
  });
});

// ─── Get Notifications ────────────────────────────────────────────────────────
// GET /api/auth/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip  = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar')
    .populate('complaint', 'ticketId title');

  const total       = await Notification.countDocuments({ recipient: req.user._id });
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.status(200).json({
    success: true,
    unreadCount,
    total,
    page,
    pages: Math.ceil(total / limit),
    notifications,
  });
});

// ─── Mark Notifications as Read ───────────────────────────────────────────────
// PUT /api/auth/notifications/read-all
const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getNotifications,
  markNotificationsRead,
};