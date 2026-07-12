const mongoose = require('mongoose');
const { STATUS } = require('../constants');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

// Indexes
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });

const Department = mongoose.model('Department', departmentSchema);
module.exports = Department;
