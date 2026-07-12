const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new ApiError(400, 'Validation Error', errorMessages));
  }
  next();
};

const createAssetValidator = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('serialNumber').notEmpty().withMessage('Serial Number is required').trim(),
  body('category').isMongoId().withMessage('Valid Category ID is required'),
  body('location').notEmpty().withMessage('Location is required').trim(),
  body('condition').notEmpty().withMessage('Condition is required').trim(),
  body('acquisitionDate').isISO8601().toDate().withMessage('Valid Acquisition Date is required'),
  body('acquisitionCost').isNumeric().withMessage('Acquisition Cost must be a number'),
  body('department').optional({ checkFalsy: true }).isMongoId().withMessage('Valid Department ID must be provided if included'),
  body('bookable').optional().isBoolean().withMessage('Bookable must be a boolean'),
  body('photo').optional().isURL().withMessage('Photo must be a valid URL'),
  body('documents').optional().isArray().withMessage('Documents must be an array'),
  validate,
];

const updateAssetValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  body('serialNumber').optional().notEmpty().withMessage('Serial Number cannot be empty').trim(),
  body('category').optional().isMongoId().withMessage('Valid Category ID is required'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty').trim(),
  body('condition').optional().notEmpty().withMessage('Condition cannot be empty').trim(),
  body('acquisitionDate').optional().isISO8601().toDate().withMessage('Valid Acquisition Date is required'),
  body('acquisitionCost').optional().isNumeric().withMessage('Acquisition Cost must be a number'),
  body('department').optional({ checkFalsy: true }).isMongoId().withMessage('Valid Department ID must be provided if included'),
  body('bookable').optional().isBoolean().withMessage('Bookable must be a boolean'),
  body('photo').optional().isURL().withMessage('Photo must be a valid URL'),
  body('documents').optional().isArray().withMessage('Documents must be an array'),
  validate,
];

module.exports = {
  createAssetValidator,
  updateAssetValidator,
};
