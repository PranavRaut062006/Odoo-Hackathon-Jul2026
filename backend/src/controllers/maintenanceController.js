const mongoose = require('mongoose');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity, createNotification } = require('../utils/logger');

const updateAssetStatusForMaintenance = async (assetId, maintenanceStatus) => {
  const asset = await Asset.findById(assetId);
  if (!asset) return;

  if (['In Progress', 'Approved', 'Technician Assigned'].includes(maintenanceStatus)) {
    if (asset.status !== 'Under Maintenance') {
      asset.status = 'Under Maintenance';
      await asset.save();
    }
  } else if (['Resolved', 'Rejected', 'Cancelled'].includes(maintenanceStatus)) {
    const activeAllocation = await Allocation.findOne({ asset: asset._id, status: 'Active' });
    if (activeAllocation) {
      if (asset.status !== 'Allocated') {
        asset.status = 'Allocated';
        await asset.save();
      }
    } else {
      if (asset.status !== 'Available') {
        asset.status = 'Available';
        await asset.save();
      }
    }
  }
};

const createMaintenance = async (req, res, next) => {
  try {
    const { asset: assetId, description, priority, status, requestedBy } = req.body;

    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    const requestedById = requestedBy || req.user._id;
    const user = await User.findById(requestedById);
    if (!user) {
      throw new ApiError(404, 'Requested by user not found');
    }

    const maintenanceStatus = status || 'Pending';
    const maintenancePriority = priority || 'Low';

    const maintenance = await MaintenanceRequest.create({
      asset: asset._id,
      requestedBy: user._id,
      description: description.trim(),
      priority: maintenancePriority,
      status: maintenanceStatus,
    });

    await updateAssetStatusForMaintenance(asset._id, maintenance.status);

    const populated = await MaintenanceRequest.findById(maintenance._id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('requestedBy', '-password');

    logActivity(
      req.user._id,
      'REQUEST_MAINTENANCE',
      'MaintenanceRequest',
      maintenance._id,
      `Maintenance requested for asset ${asset.name || asset.assetTag} by ${req.user.name || req.user.email}`,
      { priority: maintenance.priority, status: maintenance.status, assetId: asset._id }
    );

    createNotification(
      user._id,
      'Maintenance Requested',
      `Your maintenance request for asset ${asset.name || asset.assetTag} (${asset.assetTag || ''}) has been created with priority ${maintenance.priority}.`,
      'Info'
    );

    res.status(201).json(
      new ApiResponse(201, populated, 'Maintenance request created successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getMaintenance = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, priority, asset, requestedBy, employee, sort } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    if (asset) {
      if (mongoose.Types.ObjectId.isValid(asset)) {
        filter.asset = asset;
      } else {
        const matchingAssets = await Asset.find({
          $or: [
            { name: { $regex: asset, $options: 'i' } },
            { assetTag: { $regex: asset, $options: 'i' } },
            { serialNumber: { $regex: asset, $options: 'i' } },
          ]
        }).select('_id');
        filter.asset = { $in: matchingAssets.map((a) => a._id) };
      }
    }

    const targetUserQuery = requestedBy || employee;
    if (targetUserQuery) {
      if (mongoose.Types.ObjectId.isValid(targetUserQuery)) {
        filter.requestedBy = targetUserQuery;
      } else {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: targetUserQuery, $options: 'i' } },
            { email: { $regex: targetUserQuery, $options: 'i' } },
          ]
        }).select('_id');
        filter.requestedBy = { $in: matchingUsers.map((u) => u._id) };
      }
    }

    if (search) {
      const searchAssets = await Asset.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { assetTag: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');
      const searchUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]
      }).select('_id');

      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { asset: { $in: searchAssets.map((a) => a._id) } },
        { requestedBy: { $in: searchUsers.map((u) => u._id) } },
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

    const total = await MaintenanceRequest.countDocuments(filter);
    const maintenanceRequests = await MaintenanceRequest.find(filter)
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
      .populate('requestedBy', '-password');

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { maintenanceRequests, pagination }, 'Maintenance requests fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getMaintenanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    const maintenance = await MaintenanceRequest.findById(id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('requestedBy', '-password');

    if (!maintenance) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    res.status(200).json(
      new ApiResponse(200, maintenance, 'Maintenance request fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const updateMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    const maintenance = await MaintenanceRequest.findById(id);
    if (!maintenance) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    const isManagerOrAdmin = req.user.role === 'Admin' || req.user.role === 'Asset Manager';
    const isOwnerPending = maintenance.requestedBy.toString() === req.user._id.toString() && maintenance.status === 'Pending';
    if (!isManagerOrAdmin && !isOwnerPending) {
      throw new ApiError(403, 'Only Asset Manager, Admin, or owner of a pending request can update this maintenance request');
    }

    const { asset, description, priority, status } = req.body;

    if (asset && asset.toString() !== maintenance.asset.toString()) {
      const newAsset = await Asset.findById(asset);
      if (!newAsset) {
        throw new ApiError(404, 'New asset not found');
      }
      maintenance.asset = asset;
    }

    if (description) {
      maintenance.description = description.trim();
    }
    if (priority) {
      maintenance.priority = priority;
    }

    const oldStatus = maintenance.status;
    if (status && status !== oldStatus) {
      if (!isManagerOrAdmin && status !== 'Cancelled') {
        throw new ApiError(403, 'Only Asset Manager or Admin can approve, reject, or assign maintenance status');
      }
      maintenance.status = status;
    }

    await maintenance.save();

    await updateAssetStatusForMaintenance(maintenance.asset, maintenance.status);

    const populated = await MaintenanceRequest.findById(maintenance._id)
      .populate({
        path: 'asset',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('requestedBy', '-password');

    const assetObj = await Asset.findById(maintenance.asset);

    // Fire events
    if (maintenance.status === 'Approved' && oldStatus !== 'Approved') {
      logActivity(
        req.user._id,
        'APPROVE_MAINTENANCE',
        'MaintenanceRequest',
        maintenance._id,
        `Maintenance request for asset ${assetObj?.name || maintenance.asset} approved by ${req.user.name || req.user.email}`
      );
      createNotification(
        maintenance.requestedBy,
        'Maintenance Approved',
        `Your maintenance request for asset ${assetObj?.name || assetObj?.assetTag} has been approved.`,
        'Success'
      );
    } else if (maintenance.status === 'Resolved' && oldStatus !== 'Resolved') {
      logActivity(
        req.user._id,
        'COMPLETE_MAINTENANCE',
        'MaintenanceRequest',
        maintenance._id,
        `Maintenance completed for asset ${assetObj?.name || maintenance.asset} by ${req.user.name || req.user.email}`
      );
      createNotification(
        maintenance.requestedBy,
        'Maintenance Completed',
        `Your maintenance request for asset ${assetObj?.name || assetObj?.assetTag} has been resolved.`,
        'Success'
      );
    } else {
      logActivity(
        req.user._id,
        'UPDATE_MAINTENANCE',
        'MaintenanceRequest',
        maintenance._id,
        `Maintenance request updated for asset ${assetObj?.name || maintenance.asset} (Status: ${maintenance.status})`
      );
      createNotification(
        maintenance.requestedBy,
        'Maintenance Updated',
        `Your maintenance request for asset ${assetObj?.name || assetObj?.assetTag} status is now: ${maintenance.status}.`,
        'Info'
      );
    }

    res.status(200).json(
      new ApiResponse(200, populated, 'Maintenance request updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const deleteMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    const maintenance = await MaintenanceRequest.findById(id);
    if (!maintenance) {
      throw new ApiError(404, 'Maintenance request not found');
    }

    const isManagerOrAdmin = req.user.role === 'Admin' || req.user.role === 'Asset Manager';
    const isOwnerPending = maintenance.requestedBy.toString() === req.user._id.toString() && maintenance.status === 'Pending';
    if (!isManagerOrAdmin && !isOwnerPending) {
      throw new ApiError(403, 'Only Asset Manager, Admin, or owner of a pending request can delete this maintenance request');
    }

    const assetObj = await Asset.findById(maintenance.asset);

    // Hard delete or set Rejected/Cancelled
    await maintenance.deleteOne();

    await updateAssetStatusForMaintenance(maintenance.asset, 'Resolved'); // ensure asset status returns to available or allocated

    logActivity(
      req.user._id,
      'DELETE_MAINTENANCE',
      'MaintenanceRequest',
      id,
      `Maintenance request for asset ${assetObj?.name || maintenance.asset} deleted by ${req.user.name || req.user.email}`
    );

    res.status(200).json(
      new ApiResponse(200, null, 'Maintenance request deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenance,
  getMaintenance,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
};
