const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { STATUS } = require('../constants');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    const hasDuplicateError = errorMessages.some(
      (msg) =>
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('already in use') ||
        msg.toLowerCase().includes('unique')
    );
    const statusCode = hasDuplicateError ? 409 : 400;
    return next(new ApiError(statusCode, hasDuplicateError ? errorMessages[0] : 'Validation Error', errorMessages));
  }
  next();
};

const createDepartmentValidator = [
  body('name')
    .notEmpty()
    .withMessage('Department name is required')
    .trim()
    .custom(async (value) => {
      const existing = await Department.findOne({
        name: { $regex: new RegExp(`^${value}$`, 'i') },
      });
      if (existing) {
        throw new Error('Department with this name already exists');
      }
      return true;
    }),
  body('code')
    .notEmpty()
    .withMessage('Department code is required')
    .trim()
    .custom(async (value) => {
      const existing = await Department.findOne({
        code: value.toUpperCase(),
      });
      if (existing) {
        throw new Error('Department with this code already exists');
      }
      return true;
    }),
  body('parentDepartment')
    .optional({ nullable: true })
    .custom(async (value) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parentDepartment ID');
      }
      const parent = await Department.findById(value);
      if (!parent) {
        throw new Error('Parent department not found');
      }
      return true;
    }),
  body('departmentHead')
    .optional({ nullable: true })
    .custom(async (value) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid departmentHead ID');
      }
      const head = await User.findById(value);
      if (!head) {
        throw new Error('Assigned department head not found');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  validate,
];

const updateDepartmentValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .trim()
    .custom(async (value, { req }) => {
      if (!req.params?.id) return true;
      const existing = await Department.findOne({
        name: { $regex: new RegExp(`^${value}$`, 'i') },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error('Department with this name already exists');
      }
      return true;
    }),
  body('code')
    .optional()
    .notEmpty()
    .withMessage('Department code cannot be empty')
    .trim()
    .custom(async (value, { req }) => {
      if (!req.params?.id) return true;
      const existing = await Department.findOne({
        code: value.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error('Department with this code already exists');
      }
      return true;
    }),
  body('parentDepartment')
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid parentDepartment ID');
      }
      if (req.params?.id && value.toString() === req.params.id.toString()) {
        throw new Error('Department cannot be its own parent');
      }
      const parent = await Department.findById(value);
      if (!parent) {
        throw new Error('Parent department not found');
      }
      return true;
    }),
  body('departmentHead')
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      if (!value || value === '') return true;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid departmentHead ID');
      }
      const head = await User.findById(value);
      if (!head) {
        throw new Error('Assigned department head not found');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  validate,
];

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator,
};
