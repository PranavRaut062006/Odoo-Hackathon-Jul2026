const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, user, entity, action, startDate, endDate, sort } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    if (user) query.user = user;
    if (entity) query.entity = entity;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let sortOption = { createdAt: -1 };
    if (sort) {
      sortOption = sort.split(',').join(' ');
    }

    const totalLogs = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .populate('user', 'name email role');

    const pagination = {
      total: totalLogs,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalLogs / limitNumber),
    };

    res.status(200).json({
      success: true,
      message: 'Activity logs fetched successfully',
      data: logs,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getActivityById = async (req, res, next) => {
  try {
    const log = await ActivityLog.findById(req.params.id).populate('user', 'name email role');

    if (!log) {
      throw new ApiError(404, 'Activity log not found');
    }

    res.status(200).json(new ApiResponse(200, log, 'Activity log fetched successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getActivityById,
};
