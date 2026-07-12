const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity, createNotification } = require('../utils/logger');

const computeBookingStatus = (booking) => {
  if (booking.status === 'Cancelled' || booking.status === 'Completed') {
    return booking.status;
  }
  const now = new Date();
  if (now >= new Date(booking.endTime)) {
    return 'Completed';
  } else if (now >= new Date(booking.startTime) && now < new Date(booking.endTime)) {
    return 'Ongoing';
  } else {
    return 'Upcoming';
  }
};

const formatBookingResponse = (bookingDoc) => {
  if (!bookingDoc) return null;
  const obj = typeof bookingDoc.toObject === 'function' ? bookingDoc.toObject() : { ...bookingDoc };
  if (obj.resource) {
    obj.asset = obj.resource;
  }
  return obj;
};

const createBooking = async (req, res, next) => {
  try {
    const assetId = req.body.resource || req.body.asset;
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (!asset.bookable) {
      throw new ApiError(400, 'Asset is not marked as bookable (`bookable = true`)');
    }

    if (asset.status === 'Allocated' || asset.status === 'Under Maintenance') {
      throw new ApiError(409, `Conflict: Asset is currently ${asset.status} and cannot be booked.`);
    }

    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);

    // Check overlapping bookings
    const overlappingBooking = await Booking.findOne({
      resource: asset._id,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (overlappingBooking) {
      throw new ApiError(409, 'Conflict: Asset is reserved during the selected time slot.');
    }

    const employeeId = req.body.employee || req.user._id;
    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const bookingDate = req.body.bookingDate ? new Date(req.body.bookingDate) : new Date(startTime);
    const status = req.body.status || computeBookingStatus({ startTime, endTime, status: 'Upcoming' });

    const newBooking = await Booking.create({
      resource: asset._id,
      employee: employee._id,
      bookingDate,
      startTime,
      endTime,
      status,
    });

    const populated = await Booking.findById(newBooking._id)
      .populate({
        path: 'resource',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password');

    logActivity(
      req.user._id,
      'CREATE_BOOKING',
      'Booking',
      newBooking._id,
      `Booking created for asset ${asset.name || asset.assetTag} by ${req.user.name || req.user.email}`,
      { startTime, endTime, assetId: asset._id, employeeId: employee._id }
    );

    createNotification(
      employee._id,
      'Booking Created',
      `Your booking for asset ${asset.name || asset.assetTag} (${asset.assetTag || ''}) has been scheduled.`,
      'Success'
    );

    res.status(201).json(
      new ApiResponse(201, formatBookingResponse(populated), 'Booking created successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, employee, asset, resource, status, startDate, endDate, sort } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    const targetAssetQuery = asset || resource;
    if (targetAssetQuery) {
      if (mongoose.Types.ObjectId.isValid(targetAssetQuery)) {
        filter.resource = targetAssetQuery;
      } else {
        const matchingAssets = await Asset.find({
          $or: [
            { name: { $regex: targetAssetQuery, $options: 'i' } },
            { assetTag: { $regex: targetAssetQuery, $options: 'i' } },
            { serialNumber: { $regex: targetAssetQuery, $options: 'i' } },
          ]
        }).select('_id');
        filter.resource = { $in: matchingAssets.map((a) => a._id) };
      }
    }

    if (employee) {
      if (mongoose.Types.ObjectId.isValid(employee)) {
        filter.employee = employee;
      } else {
        const matchingUsers = await User.find({
          $or: [
            { name: { $regex: employee, $options: 'i' } },
            { email: { $regex: employee, $options: 'i' } },
          ]
        }).select('_id');
        filter.employee = { $in: matchingUsers.map((u) => u._id) };
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
        { resource: { $in: searchAssets.map((a) => a._id) } },
        { employee: { $in: searchUsers.map((u) => u._id) } },
      ];
    }

    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) {
        filter.startTime.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startTime.$lte = new Date(endDate);
      }
    }

    let sortObj = { startTime: 1 };
    if (sort) {
      if (sort.startsWith('-')) {
        sortObj = { [sort.substring(1)]: -1 };
      } else {
        sortObj = { [sort]: 1 };
      }
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'resource',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password');

    // Sync dynamic status where appropriate
    for (const b of bookings) {
      const updatedStatus = computeBookingStatus(b);
      if (updatedStatus !== b.status) {
        b.status = updatedStatus;
        await Booking.updateOne({ _id: b._id }, { $set: { status: updatedStatus } }).catch(() => {});
      }
    }

    const formattedBookings = bookings.map(formatBookingResponse);

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { bookings: formattedBookings, pagination }, 'Bookings fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Booking not found');
    }

    const booking = await Booking.findById(id)
      .populate({
        path: 'resource',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password');

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const updatedStatus = computeBookingStatus(booking);
    if (updatedStatus !== booking.status) {
      booking.status = updatedStatus;
      await Booking.updateOne({ _id: booking._id }, { $set: { status: updatedStatus } }).catch(() => {});
    }

    res.status(200).json(
      new ApiResponse(200, formatBookingResponse(booking), 'Booking fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Booking not found');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // RBAC check: Owner or Admin
    const isOwner = booking.employee.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Only the booking owner or Admin can update this booking');
    }

    const targetAssetId = req.body.resource || req.body.asset || booking.resource;
    const asset = await Asset.findById(targetAssetId);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (!asset.bookable) {
      throw new ApiError(400, 'Asset is not marked as bookable (`bookable = true`)');
    }

    if (targetAssetId.toString() !== booking.resource.toString() && (asset.status === 'Allocated' || asset.status === 'Under Maintenance')) {
      throw new ApiError(409, `Conflict: Asset is currently ${asset.status} and cannot be booked.`);
    }

    const newStartTime = req.body.startTime ? new Date(req.body.startTime) : booking.startTime;
    const newEndTime = req.body.endTime ? new Date(req.body.endTime) : booking.endTime;

    // Check overlapping if time or resource changed or if status is active
    if (req.body.status !== 'Cancelled') {
      const overlappingBooking = await Booking.findOne({
        resource: targetAssetId,
        _id: { $ne: booking._id },
        status: { $ne: 'Cancelled' },
        startTime: { $lt: newEndTime },
        endTime: { $gt: newStartTime },
      });

      if (overlappingBooking) {
        throw new ApiError(409, 'Conflict: Asset is reserved during the selected time slot.');
      }
    }

    if (req.body.resource || req.body.asset) {
      booking.resource = targetAssetId;
    }
    if (req.body.employee && isAdmin) {
      booking.employee = req.body.employee;
    }
    if (req.body.startTime) {
      booking.startTime = newStartTime;
    }
    if (req.body.endTime) {
      booking.endTime = newEndTime;
    }
    if (req.body.bookingDate) {
      booking.bookingDate = new Date(req.body.bookingDate);
    }
    if (req.body.status) {
      booking.status = req.body.status;
    } else {
      booking.status = computeBookingStatus(booking);
    }

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate({
        path: 'resource',
        populate: [
          { path: 'category' },
          { path: 'department' }
        ]
      })
      .populate('employee', '-password');

    logActivity(
      req.user._id,
      'UPDATE_BOOKING',
      'Booking',
      booking._id,
      `Booking updated for asset ${asset.name || asset.assetTag} by ${req.user.name || req.user.email}`,
      { startTime: booking.startTime, endTime: booking.endTime, status: booking.status }
    );

    createNotification(
      booking.employee,
      'Booking Updated',
      `Your booking for asset ${asset.name || asset.assetTag} has been updated (Status: ${booking.status}).`,
      'Info'
    );

    res.status(200).json(
      new ApiResponse(200, formatBookingResponse(populated), 'Booking updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Booking not found');
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const isOwner = booking.employee.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'Only the booking owner or Admin can delete/cancel this booking');
    }

    booking.status = 'Cancelled';
    await booking.save();

    const asset = await Asset.findById(booking.resource);

    logActivity(
      req.user._id,
      'CANCEL_BOOKING',
      'Booking',
      booking._id,
      `Booking cancelled for asset ${asset?.name || booking.resource} by ${req.user.name || req.user.email}`
    );

    createNotification(
      booking.employee,
      'Booking Cancelled',
      `Your booking for asset ${asset?.name || booking.resource} has been cancelled.`,
      'Warning'
    );

    res.status(200).json(
      new ApiResponse(200, formatBookingResponse(booking), 'Booking cancelled successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
