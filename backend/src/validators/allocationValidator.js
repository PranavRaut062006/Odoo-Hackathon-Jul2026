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
        msg.toLowerCase().includes('already allocated') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('unique')
    );
    const statusCode = hasDuplicateError ? 409 : 400;
    return next(new ApiError(statusCode, hasDuplicateError ? errorMessages[0] : 'Validation Error', errorMessages));
  }
  next();
};

const createAllocationValidator = [
  body('asset')
    .notEmpty()
    .withMessage('Asset is required')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Asset ID format');
      }
      const asset = await Asset.findById(value);
      if (!asset) {
        throw new Error('Asset not found');
      }
      return true;
    }),
  body('employee')
    .notEmpty()
    .withMessage('Employee is required')
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid Employee ID format');
      }
      const user = await User.findById(value);
      if (!user) {
        throw new Error('Employee not found');
      }
      return true;
    }),
  body('expectedReturnDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid expectedReturnDate format');
      }
      if (date <= new Date()) {
        throw new Error('Expected return date must be a future date');
      }
      return true;
    }),
  body('conditionNotes').optional().trim(),
  validate,
];

const returnAllocationValidator = [
  body('actualReturnDate')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value || value === '') return true;
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid actualReturnDate format');
      }
      return true;
    }),
  body('conditionNotes').optional().trim(),
  validate,
];

module.exports = {
  createAllocationValidator,
  returnAllocationValidator,
};
