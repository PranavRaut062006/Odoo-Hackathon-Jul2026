const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new ApiError(400, 'Validation Error', errorMessages));
  }
  next();
};

const createMaintenanceValidator = [
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
  body('description')
    .notEmpty()
    .withMessage('Maintenance description is required')
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of Low, Medium, High, Critical'),
  body('status')
    .optional()
    .isIn(['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved', 'Rejected'])
    .withMessage('Status must be one of Pending, Approved, Technician Assigned, In Progress, Resolved, Rejected'),
  body('requestedBy')
    .optional({ nullable: true })
    .custom(async (value) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid RequestedBy ID format');
      }
      const user = await User.findById(value);
      if (!user) {
        throw new Error('Requested by user not found');
      }
      return true;
    }),
  validate,
];

const updateMaintenanceValidator = [
  body('asset')
    .optional()
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
  body('description')
    .optional()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .trim(),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of Low, Medium, High, Critical'),
  body('status')
    .optional()
    .isIn(['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved', 'Rejected'])
    .withMessage('Status must be one of Pending, Approved, Technician Assigned, In Progress, Resolved, Rejected'),
  validate,
];

module.exports = {
  createMaintenanceValidator,
  updateMaintenanceValidator,
};
