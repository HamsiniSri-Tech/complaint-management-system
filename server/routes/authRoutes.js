const express = require('express');
const router  = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getNotifications,
  markNotificationsRead,
} = require('../controllers/authController');

const { protect }     = require('../middleware/authMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/register',                    registerUser);
router.post('/login',                       loginUser);
router.post('/forgot-password',             forgotPassword);
router.put('/reset-password/:token',        resetPassword);

// ─── Protected Routes ─────────────────────────────────────────────────────────
router.get('/me',                           protect, getMe);
router.put('/profile',                      protect, uploadAvatar, updateProfile);
router.put('/change-password',              protect, changePassword);

// ─── Notification Routes ──────────────────────────────────────────────────────
router.get('/notifications',                protect, getNotifications);
router.put('/notifications/read-all',       protect, markNotificationsRead);

module.exports = router;