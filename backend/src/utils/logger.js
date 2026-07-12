const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

/**
 * Non-blocking Activity Logger
 */
const logActivity = (user, action, entity, entityId, description, metadata = {}) => {
  // Fire and forget
  ActivityLog.create({
    user,
    action,
    entity,
    entityId,
    description,
    metadata,
  }).catch((err) => {
    console.error('Failed to log activity:', err.message);
  });
};

/**
 * Non-blocking Notification Creator
 */
const createNotification = (user, title, message, type = 'Info') => {
  // Fire and forget
  Notification.create({
    user,
    title,
    message,
    type,
  }).catch((err) => {
    console.error('Failed to create notification:', err.message);
  });
};

module.exports = {
  logActivity,
  createNotification,
};
