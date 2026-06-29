const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { deleteFile } = require('../middleware/uploadMiddleware');

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
// GET /api/users
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    role,
    search,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const filter = {};

  if (role)     filter.role     = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const skip   = (parseInt(page) - 1) * parseInt(limit);
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    limit: parseInt(limit),
    users,
  });
});

// ─── Get Single User (Admin) ──────────────────────────────────────────────────
// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get complaint stats for this user
  const [total, pending, resolved, rejected] = await Promise.all([
    Complaint.countDocuments({ user: user._id }),
    Complaint.countDocuments({ user: user._id, status: 'pending' }),
    Complaint.countDocuments({ user: user._id, status: 'resolved' }),
    Complaint.countDocuments({ user: user._id, status: 'rejected' }),
  ]);

  res.status(200).json({
    success: true,
    user,
    complaintStats: { total, pending, resolved, rejected },
  });
});

// ─── Create User (Admin) ──────────────────────────────────────────────────────
// POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address, department } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please provide name, email, password and role');
  }

  const validRoles = ['user', 'admin', 'agent'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }

  // Check duplicate email
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Hash password
  const salt           = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name:       name.trim(),
    email:      email.toLowerCase().trim(),
    password:   hashedPassword,
    role,
    phone:      phone      || '',
    address:    address    || '',
    department: department || '',
    isActive:   true,
  });

  // Welcome notification
  await Notification.createNotification({
    recipient: user._id,
    title:     'Account Created',
    message:   `Welcome ${user.name}! Your ${role} account has been created by an administrator.`,
    type:      'general',
  });

  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
    user: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      phone:      user.phone,
      address:    user.address,
      department: user.department,
      isActive:   user.isActive,
      createdAt:  user.createdAt,
    },
  });
});

// ─── Update User (Admin) ──────────────────────────────────────────────────────
// PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role, phone, address, department, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent demoting the only admin
  if (user.role === 'admin' && role && role !== 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      res.status(400);
      throw new Error('Cannot change role — this is the only admin account');
    }
  }

  // Check email uniqueness if changed
  if (email && email.toLowerCase() !== user.email) {
    const emailExists = await User.findOne({
      email: email.toLowerCase(),
      _id:   { $ne: req.params.id },
    });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use by another account');
    }
    user.email = email.toLowerCase().trim();
  }

  if (name       !== undefined) user.name       = name.trim();
  if (role       !== undefined) user.role       = role;
  if (phone      !== undefined) user.phone      = phone.trim();
  if (address    !== undefined) user.address    = address.trim();
  if (department !== undefined) user.department = department.trim();
  if (isActive   !== undefined) user.isActive   = isActive;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: {
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      phone:      user.phone,
      address:    user.address,
      department: user.department,
      isActive:   user.isActive,
      createdAt:  user.createdAt,
    },
  });
});

// ─── Delete User (Admin) ──────────────────────────────────────────────────────
// DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deleting own account
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  // Prevent deleting the only admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      res.status(400);
      throw new Error('Cannot delete the only admin account');
    }
  }

  // Delete avatar if exists
  if (user.avatar) deleteFile(user.avatar);

  // Delete associated complaints & notifications
  await Promise.all([
    Complaint.deleteMany({ user: user._id }),
    Notification.deleteMany({ recipient: user._id }),
  ]);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: `User "${user.name}" deleted successfully`,
  });
});

// ─── Toggle User Active Status (Admin) ───────────────────────────────────────
// PATCH /api/users/:id/toggle
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot deactivate your own account');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User "${user.name}" has been ${user.isActive ? 'activated' : 'deactivated'}`,
    isActive: user.isActive,
  });
});

// ─── Reset User Password (Admin) ──────────────────────────────────────────────
// PUT /api/users/:id/reset-password
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const salt       = await bcrypt.genSalt(10);
  user.password    = await bcrypt.hash(newPassword, salt);
  await user.save();

  // Notify user
  await Notification.createNotification({
    recipient: user._id,
    title:     'Password Reset by Admin',
    message:   'Your password has been reset by an administrator. Please change it after logging in.',
    type:      'general',
  });

  res.status(200).json({
    success: true,
    message: `Password reset successfully for "${user.name}"`,
  });
});

// ─── Get All Agents (Admin / for assignment dropdown) ─────────────────────────
// GET /api/users/agents
const getAllAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({ role: 'agent', isActive: true })
    .select('name email phone department avatar')
    .sort({ name: 1 });

  // Attach active complaint count per agent
  const agentsWithStats = await Promise.all(
    agents.map(async (agent) => {
      const activeComplaints = await Complaint.countDocuments({
        assignedAgent: agent._id,
        status: { $in: ['assigned', 'in-progress'] },
      });
      return { ...agent.toObject(), activeComplaints };
    })
  );

  res.status(200).json({
    success: true,
    total:  agents.length,
    agents: agentsWithStats,
  });
});

// ─── Get User Complaint History ───────────────────────────────────────────────
// GET /api/users/:id/complaints
const getUserComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  // Users can only view their own history
  if (
    req.user.role === 'user' &&
    req.params.id !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this user\'s complaints');
  }

  const filter = { user: req.params.id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('category', 'name color')
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page:   parseInt(page),
    pages:  Math.ceil(total / parseInt(limit)),
    complaints,
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getAllAgents,
  getUserComplaints,
};