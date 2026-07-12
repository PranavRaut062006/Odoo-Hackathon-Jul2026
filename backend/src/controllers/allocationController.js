const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity, createNotification } = require('../utils/logger');

const runWithTransaction = async (workFn) => {
  const session = await mongoose.startSession();
  let inTransaction = false;
  try {
    session.startTransaction();
    inTransaction = true;
    return await workFn(session, { session });
  } catch (error) {
    if (inTransaction) {
      try { await session.abortTransaction(); } catch (e) {}
    }
    const isStandaloneErr =
      error?.message?.includes('replica set') ||
      error?.message?.includes('Transaction numbers') ||
      error?.code === 20 ||
      error?.code === 263 ||
      error?.codeName === 'IllegalOperation';
    if (isStandaloneErr) {
      return await workFn(null, {});
    }
    throw error;
  } finally {
    session.endSession();
  }
};

const createAllocation = async (req, res, next) => {
  try {
    const result = await runWithTransaction(async (session, opts) => {
      const { asset: assetId, employee: employeeId, expectedReturnDate, conditionNotes } = req.body;

      const asset = session
        ? await Asset.findById(assetId).session(session)
        : await Asset.findById(assetId);

      if (!asset) {
        throw new ApiError(404, 'Asset not found');
      }

      if (asset.status !== 'Available') {
        let currentHolder = {};
        const activeAllocation = session
          ? await Allocation.findOne({ asset: asset._id, status: 'Active' })
              .populate('employee', '-password')
              .session(session)
          : await Allocation.findOne({ asset: asset._id, status: 'Active' }).populate(
              'employee',
              '-password'
            );

        if (activeAllocation && activeAllocation.employee) {
          currentHolder = activeAllocation.employee;
        }

        return { conflict: true, currentHolder };
      }

      const employee = session
        ? await User.findById(employeeId).session(session)
        : await User.findById(employeeId);
      if (!employee) {
        throw new ApiError(404, 'Employee not found');
      }

      const allocationPayload = {
        asset: asset._id,
        employee: employee._id,
        allocatedBy: req.user._id,
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
        conditionNotes: conditionNotes ? conditionNotes.trim() : undefined,
        status: 'Active',
      };

      const createdList = await Allocation.create([allocationPayload], opts);
      const allocation = createdList[0];

      asset.status = 'Allocated';
      if (session) {
        await asset.save({ session });
      } else {
        await asset.save();
      }

      logActivity(
        req.user._id,
        'Asset Allocated',
        'Allocation',
        allocation._id,
        `Asset ${asset.assetTag || asset._id} allocated to ${employee.name || employee._id} by ${req.user.name || req.user._id}`,
        {
          asset: asset._id,
          employee: employee._id,
          expectedReturnDate: allocation.expectedReturnDate,
        }
      );

      createNotification(
        employee._id,
        'Asset Allocated',
        `Asset ${asset.assetTag || asset.name} has been allocated to you`,
        'Info'
      );

      if (session && session.inTransaction()) {
        await session.commitTransaction();
      }

      const populatedAllocation = await Allocation.findById(allocation._id)
        .populate({
          path: 'asset',
          populate: [
            { path: 'category' },
            { path: 'department' }
          ]
        })
        .populate('employee', '-password')
        .populate('allocatedBy', '-password');

      return { conflict: false, data: populatedAllocation };
    });

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: 'Asset is already allocated.',
        currentHolder: result.currentHolder,
      });
    }

    res.status(201).json(
      new ApiResponse(201, result.data, 'Asset allocated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort, status, employee, asset, department } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (employee) {
      if (mongoose.Types.ObjectId.isValid(employee)) {
        filter.employee = employee;
      } else {
        const matchingEmployees = await User.find({
          $or: [
            { name: { $regex: employee, $options: 'i' } },
            { email: { $regex: employee, $options: 'i' } }
          ]
        }).select('_id');
        filter.employee = { $in: matchingEmployees.map(u => u._id) };
      }
    }
    if (asset) {
      if (mongoose.Types.ObjectId.isValid(asset)) {
        filter.asset = asset;
      } else {
        const matchingAssets = await Asset.find({
          $or: [
            { name: { $regex: asset, $options: 'i' } },
            { assetTag: { $regex: asset, $options: 'i' } },
            { serialNumber: { $regex: asset, $options: 'i' } }
          ]
        }).select('_id');
        filter.asset = { $in: matchingAssets.map(a => a._id) };
      }
    }
    if (department) {
      let deptMatchIds = [];
      if (mongoose.Types.ObjectId.isValid(department)) {
        deptMatchIds.push(department);
      } else {
        const matchingDepts = await Department.find({
          $or: [
            { name: { $regex: department, $options: 'i' } },
            { code: department.toUpperCase() }
          ]
        }).select('_id');
        deptMatchIds = matchingDepts.map(d => d._id);
      }
      const deptAssets = await Asset.find({ department: { $in: deptMatchIds } }).select('_id');
      const deptUsers = await User.find({ department: { $in: deptMatchIds.concat([department]) } }).select('_id');
      
      filter.$or = [
        { asset: { $in: deptAssets.map(a => a._id) } },
        { employee: { $in: deptUsers.map(u => u._id) } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (sort) {
      if (sort.startsWith('-')) {
        sortObj = { [sort.substring(1)]: -1 };
      } else {
        sortObj = { [sort]: 1 };
      }
    }

    const total = await Allocation.countDocuments(filter);
    const allocations = await Allocation.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password')
      .populate('allocatedBy', '-password');

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { allocations, pagination }, 'Allocations fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getAllocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Allocation not found');
    }

    const allocation = await Allocation.findById(id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password')
      .populate('allocatedBy', '-password');

    if (!allocation) {
      throw new ApiError(404, 'Allocation not found');
    }

    res.status(200).json(
      new ApiResponse(200, allocation, 'Allocation fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const returnAllocation = async (req, res, next) => {
  try {
    const result = await runWithTransaction(async (session, opts) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(404, 'Allocation not found');
      }

      const allocation = session
        ? await Allocation.findById(id).session(session)
        : await Allocation.findById(id);

      if (!allocation) {
        throw new ApiError(404, 'Allocation not found');
      }

      if (allocation.status !== 'Active') {
        throw new ApiError(400, 'Only Active Allocations can be returned.');
      }

      const { actualReturnDate, conditionNotes } = req.body;

      allocation.status = 'Returned';
      allocation.actualReturnDate = actualReturnDate ? new Date(actualReturnDate) : new Date();
      if (conditionNotes !== undefined) {
        allocation.conditionNotes = conditionNotes.trim();
      }

      if (session) {
        await allocation.save({ session });
      } else {
        await allocation.save();
      }

      const asset = session
        ? await Asset.findById(allocation.asset).session(session)
        : await Asset.findById(allocation.asset);

      if (asset) {
        asset.status = 'Available';
        if (session) {
          await asset.save({ session });
        } else {
          await asset.save();
        }
      }

      logActivity(
        req.user._id,
        'Asset Returned',
        'Allocation',
        allocation._id,
        `Asset ${asset?.assetTag || allocation.asset} returned by ${allocation.employee}`,
        {
          actualReturnDate: allocation.actualReturnDate,
          conditionNotes: allocation.conditionNotes,
        }
      );

      createNotification(
        allocation.employee,
        'Asset Returned',
        `Asset ${asset?.assetTag || allocation.asset} has been returned successfully`,
        'Success'
      );

      if (session && session.inTransaction()) {
        await session.commitTransaction();
      }

      const populatedAllocation = await Allocation.findById(allocation._id)
        .populate({
          path: 'asset',
          populate: [
            { path: 'category' },
            { path: 'department' }
          ]
        })
        .populate('employee', '-password')
        .populate('allocatedBy', '-password');

      return populatedAllocation;
    });

    res.status(200).json(
      new ApiResponse(200, result, 'Asset returned successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAllocation,
  getAllocations,
  getAllocationById,
  returnAllocation,
};
