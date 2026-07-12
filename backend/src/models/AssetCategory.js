const mongoose = require('mongoose');
const { STATUS } = require('../constants');

const assetCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

assetCategorySchema.index({ name: 1 });

const AssetCategory = mongoose.model('AssetCategory', assetCategorySchema);
module.exports = AssetCategory;
