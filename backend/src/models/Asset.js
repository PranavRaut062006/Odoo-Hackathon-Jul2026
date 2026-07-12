const mongoose = require('mongoose');

const ASSET_STATUS = {
  AVAILABLE: 'Available',
  ALLOCATED: 'Allocated',
  RESERVED: 'Reserved',
  UNDER_MAINTENANCE: 'Under Maintenance',
  LOST: 'Lost',
  RETIRED: 'Retired',
  DISPOSED: 'Disposed',
};

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: [true, 'Asset category is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    location: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      trim: true,
    },
    acquisitionDate: {
      type: Date,
    },
    acquisitionCost: {
      type: Number,
      min: 0,
    },
    photo: {
      type: String, // URL to photo
    },
    documents: [
      {
        type: String, // URLs to documents
      },
    ],
    bookable: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: Object.values(ASSET_STATUS),
      default: ASSET_STATUS.AVAILABLE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assetSchema.index({ assetTag: 1 });
assetSchema.index({ serialNumber: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ department: 1 });
assetSchema.index({ status: 1 });

const Asset = mongoose.model('Asset', assetSchema);
module.exports = Asset;
