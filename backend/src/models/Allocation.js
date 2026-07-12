const mongoose = require('mongoose');

const ALLOCATION_STATUS = {
  ACTIVE: 'Active',
  RETURNED: 'Returned',
};

const allocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocated by user is required'],
    },
    expectedReturnDate: {
      type: Date,
    },
    actualReturnDate: {
      type: Date,
    },
    conditionNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ALLOCATION_STATUS),
      default: ALLOCATION_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

allocationSchema.index({ asset: 1 });
allocationSchema.index({ employee: 1 });
allocationSchema.index({ status: 1 });

const Allocation = mongoose.model('Allocation', allocationSchema);
module.exports = Allocation;
