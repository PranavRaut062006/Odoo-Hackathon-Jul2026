const mongoose = require('mongoose');
const TransferRequest = require('../models/TransferRequest');
const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

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

const createTransfer = async (req, res, next) => {
  try {
    const { asset: assetId, toEmployee: toEmployeeId, fromEmployee: fromEmployeeInput, reason } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (asset.status !== 'Allocated') {
      throw new ApiError(400, 'Transfer allowed ONLY for Allocated assets.');
    }

    let fromEmployeeId = fromEmployeeInput || req.body.currentHolder;
    if (!fromEmployeeId) {
      const activeAllocation = await Allocation.findOne({ asset: asset._id, status: 'Active' });
      if (activeAllocation) {
        fromEmployeeId = activeAllocation.employee;
      } else {
        throw new ApiError(400, 'Current holder not found for this allocated asset.');
      }
    }

    const fromUser = await User.findById(fromEmployeeId);
    if (!fromUser) {
      throw new ApiError(404, 'From Employee (current holder) not found.');
    }

    const targetEmployeeId = toEmployeeId || req.body.requestedHolder;
    const toUser = await User.findById(targetEmployeeId);
    if (!toUser) {
      throw new ApiError(404, 'To Employee (requested holder) not found.');
    }

    if (fromUser._id.toString() === toUser._id.toString()) {
      throw new ApiError(400, 'Cannot transfer asset to the current holder.');
    }

    const transfer = await TransferRequest.create({
      asset: asset._id,
      fromEmployee: fromUser._id,
      toEmployee: toUser._id,
      reason: reason ? reason.trim() : 'Asset transfer request',
      requestedBy: req.user._id,
      status: 'Requested',
    });

    const populatedTransfer = await TransferRequest.findById(transfer._id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('fromEmployee', '-password')
      .populate('toEmployee', '-password')
      .populate('requestedBy', '-password');

    res.status(201).json(
      new ApiResponse(201, populatedTransfer, 'Transfer request created successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, asset, employee, department, sort } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (asset) {
      if (mongoose.Types.ObjectId.isValid(asset)) {
        filter.asset = asset;
      } else {
        const matchingAssets = await Asset.find({
          $or: [
            { name: { $regex: asset, $options: 'i' } },
            { assetTag: { $regex: asset, $options: 'i' } },
          ]
        }).select('_id');
        filter.asset = { $in: matchingAssets.map(a => a._id) };
      }
    }
    if (employee) {
      if (mongoose.Types.ObjectId.isValid(employee)) {
        filter.$or = [
          { fromEmployee: employee },
          { toEmployee: employee },
          { requestedBy: employee }
        ];
      } else {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: employee, $options: 'i' } },
            { email: { $regex: employee, $options: 'i' } }
          ]
        }).select('_id');
        const uIds = matchingUsers.map(u => u._id);
        filter.$or = [
          { fromEmployee: { $in: uIds } },
          { toEmployee: { $in: uIds } },
          { requestedBy: { $in: uIds } }
        ];
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
      
      const deptOr = [
        { asset: { $in: deptAssets.map(a => a._id) } },
        { fromEmployee: { $in: deptUsers.map(u => u._id) } },
        { toEmployee: { $in: deptUsers.map(u => u._id) } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: deptOr }];
        delete filter.$or;
      } else {
        filter.$or = deptOr;
      }
    }

    let sortObj = { createdAt: -1 };
    if (sort) {
      if (sort.startsWith('-')) {
        sortObj = { [sort.substring(1)]: -1 };
      } else {
        sortObj = { [sort]: 1 };
      }
    }

    const total = await TransferRequest.countDocuments(filter);
    const transfers = await TransferRequest.find(filter)
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
      .populate('fromEmployee', '-password')
      .populate('toEmployee', '-password')
      .populate('requestedBy', '-password')
      .populate('approvedBy', '-password');

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { transfers, pagination }, 'Transfer requests fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getTransferById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Transfer request not found');
    }

    const transfer = await TransferRequest.findById(id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('fromEmployee', '-password')
      .populate('toEmployee', '-password')
      .populate('requestedBy', '-password')
      .populate('approvedBy', '-password');

    if (!transfer) {
      throw new ApiError(404, 'Transfer request not found');
    }

    res.status(200).json(
      new ApiResponse(200, transfer, 'Transfer request fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const approveTransfer = async (req, res, next) => {
  try {
    const result = await runWithTransaction(async (session, opts) => {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(404, 'Transfer request not found');
      }

      const transfer = session
        ? await TransferRequest.findById(id).session(session)
        : await TransferRequest.findById(id);

      if (!transfer) {
        throw new ApiError(404, 'Transfer request not found');
      }

      if (transfer.status !== 'Requested') {
        throw new ApiError(400, 'Only pending (Requested) transfers can be approved.');
      }

      const activeAllocation = session
        ? await Allocation.findOne({ asset: transfer.asset, status: 'Active' }).session(session)
        : await Allocation.findOne({ asset: transfer.asset, status: 'Active' });

      if (activeAllocation) {
        activeAllocation.status = 'Returned';
        activeAllocation.actualReturnDate = new Date();
        activeAllocation.conditionNotes = 'Closed via asset transfer approval.';
        if (session) {
          await activeAllocation.save({ session });
        } else {
          await activeAllocation.save();
        }
      }

      const [newAllocation] = await Allocation.create(
        [
          {
            asset: transfer.asset,
            employee: transfer.toEmployee,
            allocatedBy: req.user._id,
            status: 'Active',
          },
        ],
        opts
      );

      const asset = session
        ? await Asset.findById(transfer.asset).session(session)
        : await Asset.findById(transfer.asset);

      if (asset) {
        asset.status = 'Allocated';
        const toUser = session
          ? await User.findById(transfer.toEmployee).session(session)
          : await User.findById(transfer.toEmployee);

        if (toUser && toUser.department && mongoose.Types.ObjectId.isValid(toUser.department)) {
          asset.department = toUser.department;
        }
        if (session) {
          await asset.save({ session });
        } else {
          await asset.save();
        }
      }

      const targetStatus = req.body.status === 'Approved' ? 'Approved' : 'Completed';
      transfer.status = targetStatus;
      transfer.approvedBy = req.user._id;
      if (session) {
        await transfer.save({ session });
      } else {
        await transfer.save();
      }

      await ActivityLog.create(
        [
          {
            user: req.user._id,
            action: 'APPROVE_TRANSFER',
            entity: 'TransferRequest',
            entityId: transfer._id,
            description: `Transfer of asset ${asset?.assetTag || transfer.asset} to employee ${transfer.toEmployee} approved by ${req.user.name || req.user._id}`,
            metadata: {
              newAllocationId: newAllocation._id,
              closedAllocationId: activeAllocation ? activeAllocation._id : null,
            },
          },
        ],
        opts
      );

      if (session && session.inTransaction()) {
        await session.commitTransaction();
      }

      const populatedTransfer = await TransferRequest.findById(transfer._id)
        .populate({
          path: 'asset',
          populate: [
            { path: 'category' },
            { path: 'department' }
          ]
        })
        .populate('fromEmployee', '-password')
        .populate('toEmployee', '-password')
        .populate('requestedBy', '-password')
        .populate('approvedBy', '-password');

      return populatedTransfer;
    });

    res.status(200).json(
      new ApiResponse(200, result, 'Transfer request approved successfully')
    );
  } catch (error) {
    next(error);
  }
};

const rejectTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Transfer request not found');
    }

    const transfer = await TransferRequest.findById(id);
    if (!transfer) {
      throw new ApiError(404, 'Transfer request not found');
    }

    if (transfer.status !== 'Requested') {
      throw new ApiError(400, 'Only pending (Requested) transfers can be rejected.');
    }

    transfer.status = 'Rejected';
    transfer.approvedBy = req.user._id;
    await transfer.save();

    await ActivityLog.create({
      user: req.user._id,
      action: 'REJECT_TRANSFER',
      entity: 'TransferRequest',
      entityId: transfer._id,
      description: `Transfer request for asset ${transfer.asset} rejected by ${req.user.name || req.user._id}`,
    });

    const populatedTransfer = await TransferRequest.findById(transfer._id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('fromEmployee', '-password')
      .populate('toEmployee', '-password')
      .populate('requestedBy', '-password')
      .populate('approvedBy', '-password');

    res.status(200).json(
      new ApiResponse(200, populatedTransfer, 'Transfer request rejected successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
  approveTransfer,
  rejectTransfer,
};
