const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, unreadOnly } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let query = { user: req.user._id };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const totalNotifications = await Notification.countDocuments(query);
    // Unread first, then newest first
    const notifications = await Notification.find(query)
      .sort({ isRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const pagination = {
      total: totalNotifications,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalNotifications / limitNumber),
    };

    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, 'Notification not found or unauthorized');
    }

    res.status(200).json(new ApiResponse(200, notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found or unauthorized');
    }

    res.status(200).json(new ApiResponse(200, null, 'Notification deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
