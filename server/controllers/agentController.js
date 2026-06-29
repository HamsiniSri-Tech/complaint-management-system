const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');

// ─── Get Agent Dashboard Stats ────────────────────────────────────────────────
// GET /api/agent/stats
const getAgentStats = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  const [
    totalAssigned,
    pendingCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    rejectedCount,
  ] = await Promise.all([
    Complaint.countDocuments({ assignedAgent: agentId }),
    Complaint.countDocuments({ assignedAgent: agentId, status: 'pending' }),
    Complaint.countDocuments({ assignedAgent: agentId, status: 'assigned' }),
    Complaint.countDocuments({ assignedAgent: agentId, status: 'in-progress' }),
    Complaint.countDocuments({ assignedAgent: agentId, status: 'resolved' }),
    Complaint.countDocuments({ assignedAgent: agentId, status: 'rejected' }),
  ]);

  // Monthly resolution trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await Complaint.aggregate([
    {
      $match: {
        assignedAgent: agentId,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total:    { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: {
                if:   { $lt: ['$_id.month', 10] },
                then: { $concat: ['0', { $toString: '$_id.month' }] },
                else: { $toString: '$_id.month' },
              },
            },
          ],
        },
        total:    1,
        resolved: 1,
      },
    },
  ]);

  // Priority breakdown
  const byPriority = await Complaint.aggregate([
    { $match: { assignedAgent: agentId } },
    {
      $group: {
        _id:   '$priority',
        count: { $sum: 1 },
      },
    },
  ]);

  // Recent assigned complaints
  const recentComplaints = await Complaint.find({ assignedAgent: agentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email avatar')
    .populate('category', 'name color');

  // Resolution rate
  const resolutionRate =
    totalAssigned > 0
      ? Math.round((resolvedCount / totalAssigned) * 100)
      : 0;

  res.status(200).json({
    success: true,
    stats: {
      totalAssigned,
      resolutionRate,
      byStatus: {
        pending:    pendingCount,
        assigned:   assignedCount,
        inProgress: inProgressCount,
        resolved:   resolvedCount,
        rejected:   rejectedCount,
      },
      byPriority,
      monthlyTrend,
      recentComplaints,
    },
  });
});

// ─── Get Agent's Assigned Complaints ─────────────────────────────────────────
// GET /api/agent/complaints
const getAgentComplaints = asyncHandler(async (req, res) => {
  const {
    page      = 1,
    limit     = 10,
    status,
    priority,
    search,
    sortBy    = 'createdAt',
    sortOrder = 'desc',
    startDate,
    endDate,
  } = req.query;

  const filter = { assignedAgent: req.user._id };

  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { title:    { $regex: search, $options: 'i' } },
      { ticketId: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip    = (parseInt(page) - 1) * parseInt(limit);
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('category', 'name color')
      .populate('user', 'name email avatar phone')
      .sort({ [sortBy]: sortDir })
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    limit: parseInt(limit),
    complaints,
  });
});

// ─── Get Single Assigned Complaint ────────────────────────────────────────────
// GET /api/agent/complaints/:id
const getAgentComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id:           req.params.id,
    assignedAgent: req.user._id,
  })
    .populate('category', 'name color description')
    .populate('user', 'name email phone avatar address')
    .populate('assignedAgent', 'name email phone avatar department')
    .populate('statusHistory.changedBy', 'name role');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found or not assigned to you');
  }

  res.status(200).json({
    success: true,
    complaint,
  });
});

// ─── Update Complaint Status (Agent) ─────────────────────────────────────────
// PUT /api/agent/complaints/:id/status
const agentUpdateStatus = asyncHandler(async (req, res) => {
  const { status, resolutionNotes, rejectionReason } = req.body;

  // Agents can only set these statuses
  const agentAllowedStatuses = ['in-progress', 'resolved', 'rejected'];

  if (!status || !agentAllowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      `Agents can only set status to: ${agentAllowedStatuses.join(', ')}`
    );
  }

  if (status === 'resolved' && !resolutionNotes) {
    res.status(400);
    throw new Error('Resolution notes are required when resolving a complaint');
  }

  const complaint = await Complaint.findOne({
    _id:           req.params.id,
    assignedAgent: req.user._id,
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found or not assigned to you');
  }

  // Prevent re-opening resolved/rejected complaints
  if (['resolved', 'rejected'].includes(complaint.status)) {
    res.status(400);
    throw new Error(
      `Cannot update a complaint that is already "${complaint.status}"`
    );
  }

  const oldStatus = complaint.status;

  // Update fields
  complaint.status = status;

  if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
  if (rejectionReason) complaint.rejectionReason = rejectionReason.trim();

  if (status === 'resolved') complaint.resolvedAt = new Date();
  if (status === 'rejected') complaint.rejectedAt = new Date();

  // Push to status history
  complaint.statusHistory.push({
    status,
    changedBy: req.user._id,
    note:
      resolutionNotes ||
      rejectionReason ||
      `Status updated from "${oldStatus}" to "${status}" by agent`,
  });

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('category', 'name color')
    .populate('user', 'name email')
    .populate('assignedAgent', 'name email');

  // Notify complaint owner
  const notifType =
    status === 'resolved'
      ? 'complaint_resolved'
      : status === 'rejected'
      ? 'complaint_rejected'
      : 'status_updated';

  await Notification.createNotification({
    recipient: complaint.user,
    sender:    req.user._id,
    title:     `Complaint ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message:
      status === 'resolved'
        ? `Great news! Your complaint "${complaint.title}" has been resolved. ${
            resolutionNotes ? `Note: ${resolutionNotes}` : ''
          }`
        : status === 'rejected'
        ? `Your complaint "${complaint.title}" has been rejected. ${
            rejectionReason ? `Reason: ${rejectionReason}` : ''
          }`
        : `Your complaint "${complaint.title}" status has been updated to "${status}".`,
    type:      notifType,
    complaint: complaint._id,
  });

  res.status(200).json({
    success: true,
    message: `Complaint status updated to "${status}" successfully`,
    complaint: updated,
  });
});

// ─── Add Resolution Notes (Agent) ─────────────────────────────────────────────
// PUT /api/agent/complaints/:id/notes
const addResolutionNotes = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;

  if (!resolutionNotes || !resolutionNotes.trim()) {
    res.status(400);
    throw new Error('Resolution notes cannot be empty');
  }

  const complaint = await Complaint.findOne({
    _id:           req.params.id,
    assignedAgent: req.user._id,
  });

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found or not assigned to you');
  }

  complaint.resolutionNotes = resolutionNotes.trim();
  await complaint.save();

  // Notify complaint owner
  await Notification.createNotification({
    recipient: complaint.user,
    sender:    req.user._id,
    title:     'Notes Added to Your Complaint',
    message:   `An agent has added notes to your complaint "${complaint.title}".`,
    type:      'status_updated',
    complaint: complaint._id,
  });

  res.status(200).json({
    success: true,
    message: 'Resolution notes updated successfully',
    resolutionNotes: complaint.resolutionNotes,
  });
});

// ─── Get Agent Profile Summary ────────────────────────────────────────────────
// GET /api/agent/profile-summary
const getAgentProfileSummary = asyncHandler(async (req, res) => {
  const agentId = req.user._id;

  const totalResolved = await Complaint.countDocuments({
    assignedAgent: agentId,
    status:        'resolved',
  });

  const totalAssigned = await Complaint.countDocuments({
    assignedAgent: agentId,
  });

  const avgResolutionTime = await Complaint.aggregate([
    {
      $match: {
        assignedAgent: agentId,
        status:        'resolved',
        resolvedAt:    { $ne: null },
      },
    },
    {
      $project: {
        resolutionTime: {
          $divide: [
            { $subtract: ['$resolvedAt', '$createdAt'] },
            1000 * 60 * 60, // Convert ms to hours
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avg: { $avg: '$resolutionTime' },
      },
    },
  ]);

  const avgHours =
    avgResolutionTime.length > 0
      ? Math.round(avgResolutionTime[0].avg)
      : 0;

  res.status(200).json({
    success: true,
    summary: {
      totalAssigned,
      totalResolved,
      resolutionRate:
        totalAssigned > 0
          ? Math.round((totalResolved / totalAssigned) * 100)
          : 0,
      avgResolutionHours: avgHours,
    },
  });
});

module.exports = {
  getAgentStats,
  getAgentComplaints,
  getAgentComplaintById,
  agentUpdateStatus,
  addResolutionNotes,
  getAgentProfileSummary,
};