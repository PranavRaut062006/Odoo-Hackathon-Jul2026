const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ROLES, STATUS } = require('../constants');

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

const updateEmployeeValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      if (!req.params?.id) return true;
      const existing = await User.findOne({
        email: value,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error('User with this email already exists');
      }
      return true;
    }),
  body('department').optional().trim(),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of ${Object.values(ROLES).join(', ')}`),
  validate,
];

const promoteEmployeeValidator = [
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of ${Object.values(ROLES).join(', ')}`),
  body('department').optional().trim(),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  validate,
];

module.exports = {
  updateEmployeeValidator,
  promoteEmployeeValidator,
};
