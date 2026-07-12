const mongoose = require('mongoose');

const NOTIFICATION_TYPES = {
  INFO: 'Info',
  SUCCESS: 'Success',
  WARNING: 'Warning',
  ERROR: 'Error',
};

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.INFO,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // The requirement mentions createdAt explicitly, but adding timestamps handles both
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
