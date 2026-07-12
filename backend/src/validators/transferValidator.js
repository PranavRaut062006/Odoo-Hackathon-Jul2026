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

const createTransferValidator = [
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
      if (asset.status !== 'Allocated') {
        throw new Error('Transfer allowed ONLY for Allocated assets.');
      }
      return true;
    }),
  body()
    .custom(async (value, { req }) => {
      const toId = req.body.toEmployee || req.body.requestedHolder;
      if (!toId) {
        throw new Error('To Employee (requested holder) is required');
      }
      if (!mongoose.Types.ObjectId.isValid(toId)) {
        throw new Error('Invalid To Employee ID format');
      }
      const toUser = await User.findById(toId);
      if (!toUser) {
        throw new Error('To Employee not found');
      }
      return true;
    }),
  body('reason')
    .notEmpty()
    .withMessage('Transfer reason is required')
    .trim(),
  validate,
];

module.exports = {
  createTransferValidator,
};
