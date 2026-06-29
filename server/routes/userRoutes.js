const express = require('express');
const router  = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getAllAgents,
  getUserComplaints,
} = require('../controllers/userController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── Admin Only Routes ────────────────────────────────────────────────────────
router.get('/',                        protect, adminOnly, getAllUsers);
router.get('/agents',                  protect, adminOnly, getAllAgents);
router.post('/',                       protect, adminOnly, createUser);
router.get('/:id',                     protect, adminOnly, getUserById);
router.put('/:id',                     protect, adminOnly, updateUser);
router.delete('/:id',                  protect, adminOnly, deleteUser);
router.patch('/:id/toggle',            protect, adminOnly, toggleUserStatus);
router.put('/:id/reset-password',      protect, adminOnly, resetUserPassword);

// ─── User can view their own complaint history ────────────────────────────────
router.get('/:id/complaints',          protect, getUserComplaints);

module.exports = router;