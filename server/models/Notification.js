const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    type: {
      type: String,
      enum: [
        'complaint_submitted',
        'complaint_assigned',
        'status_updated',
        'complaint_resolved',
        'complaint_rejected',
        'new_complaint',
        'general',
      ],
      default: 'general',
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Mark notification as read ────────────────────────────────────────────────
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// ─── Static: create notification helper ──────────────────────────────────────
notificationSchema.statics.createNotification = async function ({
  recipient,
  sender = null,
  title,
  message,
  type = 'general',
  complaint = null,
}) {
  try {
    const notification = await this.create({
      recipient,
      sender,
      title,
      message,
      type,
      complaint,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

// ─── Static: get unread count ─────────────────────────────────────────────────
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

// ─── Static: mark all as read for a user ─────────────────────────────────────
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// ─── Index for fast lookup ────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);