const { body, validationResult } = require('express-validator');
const AssetCategory = require('../models/AssetCategory');
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

const createCategoryValidator = [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .trim()
    .custom(async (value) => {
      const existing = await AssetCategory.findOne({
        name: { $regex: new RegExp(`^${value}$`, 'i') },
      });
      if (existing) {
        throw new Error('Category with this name already exists');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  validate,
];

const updateCategoryValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .trim()
    .custom(async (value, { req }) => {
      if (!req.params?.id) return true;
      const existing = await AssetCategory.findOne({
        name: { $regex: new RegExp(`^${value}$`, 'i') },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        throw new Error('Category with this name already exists');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim(),
  body('status')
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage(`Status must be one of ${Object.values(STATUS).join(', ')}`),
  validate,
];

module.exports = {
  createCategoryValidator,
  updateCategoryValidator,
};
