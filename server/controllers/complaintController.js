const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { deleteFile } = require('../middleware/uploadMiddleware');

// ─── Create Complaint ─────────────────────────────────────────────────────────
// POST /api/complaints
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    res.status(400);
    throw new Error('Please provide title, description and category');
  }

  // Validate category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(400);
    throw new Error('Invalid category selected');
  }

  // Handle file attachments
  const attachments = req.files
    ? req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }))
    : [];

  // Create complaint
  const complaint = await Complaint.create({
    title: title.trim(),
    description: description.trim(),
    category,
    priority: priority || 'medium',
    user: req.user._id,
    attachments,
    status: 'pending',
  });

  // Increment category complaint count
  await Category.incrementCount(category);

  // Populate for response
  const populated = await Complaint.findById(complaint._id)
    .populate('category', 'name color')
    .populate('user', 'name email');

  // Notify all admins
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin', isActive: true });
  await Promise.all(
    admins.map((admin) =>
      Notification.createNotification({
        recipient: admin._id,
        sender: req.user._id,
        title: 'New Complaint Submitted',
        message: `${req.user.name} submitted a new complaint: "${title}"`,
        type: 'new_complaint',
        complaint: complaint._id,
      })
    )
  );

  // Notify the user
  await Notification.createNotification({
    recipient: req.user._id,
    title: 'Complaint Submitted Successfully',
    message: `Your complaint "${title}" has been submitted. Ticket ID: ${populated.ticketId}`,
    type: 'complaint_submitted',
    complaint: complaint._id,
  });

  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully',
    complaint: populated,
  });
});

// ─── Get All Complaints (Admin) ───────────────────────────────────────────────
// GET /api/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    category,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    startDate,
    endDate,
  } = req.query;

  // Build filter object
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'user') {
    filter.user = req.user._id;
  } else if (req.user.role === 'agent') {
    filter.assignedAgent = req.user._id;
  }

  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate)   filter.createdAt.$lte = new Date(endDate);
  }

  // Search filter
  if (search) {
    filter.$or = [
      { title:    { $regex: search, $options: 'i' } },
      { ticketId: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip      = (parseInt(page) - 1) * parseInt(limit);
  const sortField = sortBy === 'date' ? 'createdAt' : sortBy;
  const sortDir   = sortOrder === 'asc' ? 1 : -1;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('category', 'name color')
      .populate('user', 'name email avatar')
      .populate('assignedAgent', 'name email avatar')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    limit: parseInt(limit),
    complaints,
  });
});

// ─── Get Single Complaint ─────────────────────────────────────────────────────
// GET /api/complaints/:id
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('category', 'name color description')
    .populate('user', 'name email phone avatar')
    .populate('assignedAgent', 'name email phone avatar department')
    .populate('statusHistory.changedBy', 'name role');

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Access control
  if (
    req.user.role === 'user' &&
    complaint.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  if (
    req.user.role === 'agent' &&
    complaint.assignedAgent?._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view this complaint');
  }

  res.status(200).json({
    success: true,
    complaint,
  });
});

// ─── Update Complaint (User: edit own pending) ────────────────────────────────
// PUT /api/complaints/:id
const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Only owner can edit, and only if still pending
  if (complaint.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this complaint');
  }

  if (complaint.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending complaints can be edited');
  }

  const { title, description, category, priority } = req.body;

  if (title)       complaint.title       = title.trim();
  if (description) complaint.description = description.trim();
  if (priority)    complaint.priority    = priority;

  // Handle category change
  if (category && category !== complaint.category.toString()) {
    await Category.decrementCount(complaint.category);
    await Category.incrementCount(category);
    complaint.category = category;
  }

  // Handle new attachments
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));
    complaint.attachments.push(...newAttachments);
  }

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('category', 'name color')
    .populate('user', 'name email');

  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    complaint: updated,
  });
});

// ─── Delete Complaint (Admin only) ───────────────────────────────────────────
// DELETE /api/complaints/:id
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Delete associated files
  complaint.attachments.forEach((file) => deleteFile(file.filename));

  // Decrement category count
  await Category.decrementCount(complaint.category);

  await complaint.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Complaint deleted successfully',
  });
});

// ─── Assign Complaint to Agent (Admin) ───────────────────────────────────────
// PUT /api/complaints/:id/assign
const assignComplaint = asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    res.status(400);
    throw new Error('Please provide an agent ID');
  }

  const User = require('../models/User');
  const agent = await User.findById(agentId);

  if (!agent || agent.role !== 'agent') {
    res.status(400);
    throw new Error('Invalid agent selected');
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Update complaint
  complaint.assignedAgent = agentId;
  complaint.status        = 'assigned';
  complaint.statusHistory.push({
    status:    'assigned',
    changedBy: req.user._id,
    note:      `Assigned to agent: ${agent.name}`,
  });

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('category', 'name color')
    .populate('user', 'name email')
    .populate('assignedAgent', 'name email');

  // Notify agent
  await Notification.createNotification({
    recipient: agentId,
    sender:    req.user._id,
    title:     'New Complaint Assigned',
    message:   `Complaint "${complaint.title}" (${complaint.ticketId}) has been assigned to you.`,
    type:      'complaint_assigned',
    complaint: complaint._id,
  });

  // Notify complaint owner
  await Notification.createNotification({
    recipient: complaint.user,
    sender:    req.user._id,
    title:     'Complaint Assigned to Agent',
    message:   `Your complaint "${complaint.title}" has been assigned to an agent and is being processed.`,
    type:      'complaint_assigned',
    complaint: complaint._id,
  });

  res.status(200).json({
    success: true,
    message: `Complaint assigned to ${agent.name} successfully`,
    complaint: updated,
  });
});

// ─── Update Complaint Status (Admin / Agent) ──────────────────────────────────
// PUT /api/complaints/:id/status
const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { status, resolutionNotes, rejectionReason } = req.body;

  const validStatuses = ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Agent can only update their assigned complaints
  if (
    req.user.role === 'agent' &&
    complaint.assignedAgent?.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to update this complaint');
  }

  const oldStatus = complaint.status;

  // Update fields
  complaint.status = status;

  if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
  if (rejectionReason) complaint.rejectionReason = rejectionReason.trim();

  if (status === 'resolved') complaint.resolvedAt  = new Date();
  if (status === 'rejected') complaint.rejectedAt  = new Date();

  // Push to status history
  complaint.statusHistory.push({
    status,
    changedBy: req.user._id,
    note: resolutionNotes || rejectionReason || `Status changed from ${oldStatus} to ${status}`,
  });

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('category', 'name color')
    .populate('user', 'name email')
    .populate('assignedAgent', 'name email');

  // Notify complaint owner
  const notifType = status === 'resolved' ? 'complaint_resolved'
                  : status === 'rejected' ? 'complaint_rejected'
                  : 'status_updated';

  await Notification.createNotification({
    recipient: complaint.user,
    sender:    req.user._id,
    title:     `Complaint Status Updated`,
    message:   `Your complaint "${complaint.title}" status has been updated to "${status}".`,
    type:      notifType,
    complaint: complaint._id,
  });

  res.status(200).json({
    success: true,
    message: `Complaint status updated to "${status}" successfully`,
    complaint: updated,
  });
});

// ─── Get Dashboard Statistics (Admin) ────────────────────────────────────────
// GET /api/complaints/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalComplaints,
    pendingCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    rejectedCount,
    totalUsers,
    totalAgents,
  ] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.countDocuments({ status: 'pending' }),
    Complaint.countDocuments({ status: 'assigned' }),
    Complaint.countDocuments({ status: 'in-progress' }),
    Complaint.countDocuments({ status: 'resolved' }),
    Complaint.countDocuments({ status: 'rejected' }),
    require('../models/User').countDocuments({ role: 'user' }),
    require('../models/User').countDocuments({ role: 'agent' }),
  ]);

  // Complaints by category
  const byCategory = await Complaint.aggregate([
    {
      $group: {
        _id:   '$category',
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from:         'categories',
        localField:   '_id',
        foreignField: '_id',
        as:           'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        name:  '$category.name',
        color: '$category.color',
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Complaints by priority
  const byPriority = await Complaint.aggregate([
    {
      $group: {
        _id:   '$priority',
        count: { $sum: 1 },
      },
    },
  ]);

  // Monthly trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await Complaint.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
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
        count: 1,
        _id:   0,
      },
    },
  ]);

  // Recent complaints
  const recentComplaints = await Complaint.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .populate('category', 'name color');

  res.status(200).json({
    success: true,
    stats: {
      totalComplaints,
      totalUsers,
      totalAgents,
      byStatus: {
        pending:    pendingCount,
        assigned:   assignedCount,
        inProgress: inProgressCount,
        resolved:   resolvedCount,
        rejected:   rejectedCount,
      },
      byCategory,
      byPriority,
      monthlyTrend,
      recentComplaints,
    },
  });
});

// ─── Remove Attachment ────────────────────────────────────────────────────────
// DELETE /api/complaints/:id/attachment/:filename
const removeAttachment = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  if (complaint.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const { filename } = req.params;
  const attachmentIndex = complaint.attachments.findIndex(
    (a) => a.filename === filename
  );

  if (attachmentIndex === -1) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  // Remove from disk
  deleteFile(filename);

  // Remove from complaint
  complaint.attachments.splice(attachmentIndex, 1);
  await complaint.save();

  res.status(200).json({
    success: true,
    message: 'Attachment removed successfully',
  });
});

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  updateComplaintStatus,
  getDashboardStats,
  removeAttachment,
};