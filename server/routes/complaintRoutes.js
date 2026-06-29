const express = require('express');
const router  = express.Router();

const {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  updateComplaintStatus,
  getDashboardStats,
  removeAttachment,
} = require('../controllers/complaintController');

const { protect, adminOnly, agentOnly } = require('../middleware/authMiddleware');
const { uploadComplaintFiles }          = require('../middleware/uploadMiddleware');

// ─── Stats (Admin only) ───────────────────────────────────────────────────────
router.get('/stats',              protect, adminOnly, getDashboardStats);

// ─── Core CRUD ────────────────────────────────────────────────────────────────
router.get('/',                   protect, getAllComplaints);
router.post('/',                  protect, uploadComplaintFiles, createComplaint);
router.get('/:id',                protect, getComplaintById);
router.put('/:id',                protect, uploadComplaintFiles, updateComplaint);
router.delete('/:id',             protect, adminOnly, deleteComplaint);

// ─── Admin Actions ────────────────────────────────────────────────────────────
router.put('/:id/assign',         protect, adminOnly, assignComplaint);

// ─── Status Update (Admin + Agent) ───────────────────────────────────────────
router.put('/:id/status',         protect, agentOnly, updateComplaintStatus);

// ─── Attachment Management ────────────────────────────────────────────────────
router.delete(
  '/:id/attachment/:filename',
  protect,
  removeAttachment
);

module.exports = router;