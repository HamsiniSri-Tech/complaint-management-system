const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'],
      default: 'pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    attachments: [
      {
        filename: { type: String },
        originalName: { type: String },
        mimetype: { type: String },
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Resolution notes cannot exceed 2000 characters'],
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'assigned', 'in-progress', 'resolved', 'rejected'],
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: '',
        },
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Auto-generate Ticket ID before saving ───────────────────────────────────
complaintSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Complaint').countDocuments();
    const timestamp = Date.now().toString().slice(-5);
    this.ticketId = `TKT-${timestamp}-${String(count + 1).padStart(4, '0')}`;
  }

  // Push initial status into history on first save
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.user,
      note: 'Complaint submitted',
    });
  }

  next();
});

// ─── Virtual: attachment URLs ─────────────────────────────────────────────────
complaintSchema.virtual('attachmentUrls').get(function () {
  return this.attachments.map((file) => ({
    ...file.toObject(),
    url: `http://localhost:5000/uploads/${file.filename}`,
  }));
});

complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

// ─── Indexes for fast querying ────────────────────────────────────────────────
complaintSchema.index({ user: 1, status: 1 });
complaintSchema.index({ assignedAgent: 1, status: 1 });
// complaintSchema.index({ ticketId: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);