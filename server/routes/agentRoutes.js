const express = require('express');
const router  = express.Router();

const {
  getAgentStats,
  getAgentComplaints,
  getAgentComplaintById,
  agentUpdateStatus,
  addResolutionNotes,
  getAgentProfileSummary,
} = require('../controllers/agentController');

const { protect, agentOnly } = require('../middleware/authMiddleware');

// ─── All routes require auth + agent/admin role ───────────────────────────────
router.use(protect, agentOnly);

router.get('/stats',                        getAgentStats);
router.get('/profile-summary',              getAgentProfileSummary);
router.get('/complaints',                   getAgentComplaints);
router.get('/complaints/:id',               getAgentComplaintById);
router.put('/complaints/:id/status',        agentUpdateStatus);
router.put('/complaints/:id/notes',         addResolutionNotes);

module.exports = router;