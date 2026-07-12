const mongoose = require('mongoose');

const MAINTENANCE_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const MAINTENANCE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  TECHNICIAN_ASSIGNED: 'Technician Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

const maintenanceRequestSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested by user is required'],
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(MAINTENANCE_PRIORITY),
      default: MAINTENANCE_PRIORITY.LOW,
    },
    status: {
      type: String,
      enum: Object.values(MAINTENANCE_STATUS),
      default: MAINTENANCE_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

maintenanceRequestSchema.index({ asset: 1 });
maintenanceRequestSchema.index({ requestedBy: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ priority: 1 });

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
module.exports = MaintenanceRequest;
