const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    const hasDuplicateError = errorMessages.some(
      (msg) =>
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('conflict') ||
        msg.toLowerCase().includes('overlap')
    );
    const statusCode = hasDuplicateError ? 409 : 400;
    return next(new ApiError(statusCode, hasDuplicateError ? errorMessages[0] : 'Validation Error', errorMessages));
  }
  next();
};

const createBookingValidator = [
  body().custom(async (value, { req }) => {
    const assetId = req.body.resource || req.body.asset;
    if (!assetId) {
      throw new Error('Resource (Asset) ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(assetId)) {
      throw new Error('Invalid Resource (Asset) ID format');
    }
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    return true;
  }),
  body('employee')
    .optional({ nullable: true })
    .custom(async (value) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Employee ID format');
      }
      const user = await User.findById(value);
      if (!user) {
        throw new Error('Employee not found');
      }
      return true;
    }),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid startTime format');
      }
      return true;
    }),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .custom((value, { req }) => {
      const end = new Date(value);
      if (isNaN(end.getTime())) {
        throw new Error('Invalid endTime format');
      }
      if (req.body.startTime) {
        const start = new Date(req.body.startTime);
        if (!isNaN(start.getTime()) && end <= start) {
          throw new Error('End time must be later than Start time');
        }
      }
      return true;
    }),
  body('bookingDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid bookingDate format');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['Upcoming', 'Ongoing', 'Completed', 'Cancelled'])
    .withMessage('Status must be one of Upcoming, Ongoing, Completed, Cancelled'),
  validate,
];

const updateBookingValidator = [
  body('startTime')
    .optional()
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid startTime format');
      }
      return true;
    }),
  body('endTime')
    .optional()
    .custom((value, { req }) => {
      const end = new Date(value);
      if (isNaN(end.getTime())) {
        throw new Error('Invalid endTime format');
      }
      if (req.body.startTime) {
        const start = new Date(req.body.startTime);
        if (!isNaN(start.getTime()) && end <= start) {
          throw new Error('End time must be later than Start time');
        }
      }
      return true;
    }),
  body('bookingDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid bookingDate format');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['Upcoming', 'Ongoing', 'Completed', 'Cancelled'])
    .withMessage('Status must be one of Upcoming, Ongoing, Completed, Cancelled'),
  validate,
];

module.exports = {
  createBookingValidator,
  updateBookingValidator,
};
