const mongoose = require('mongoose');

const TRANSFER_STATUS = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const transferRequestSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    fromEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'From Employee is required'],
    },
    toEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'To Employee is required'],
    },
    reason: {
      type: String,
      required: [true, 'Transfer reason is required'],
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested by user is required'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(TRANSFER_STATUS),
      default: TRANSFER_STATUS.REQUESTED,
    },
  },
  {
    timestamps: true,
  }
);

transferRequestSchema.index({ asset: 1 });
transferRequestSchema.index({ fromEmployee: 1 });
transferRequestSchema.index({ toEmployee: 1 });
transferRequestSchema.index({ status: 1 });

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);
module.exports = TransferRequest;
