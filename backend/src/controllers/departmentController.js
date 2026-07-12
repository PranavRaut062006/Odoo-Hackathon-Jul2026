const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { STATUS } = require('../constants');
const { logActivity } = require('../utils/logger');

const getDepartments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    let sortObj = { createdAt: -1 };
    if (sort) {
      if (sort.startsWith('-')) {
        sortObj = { [sort.substring(1)]: -1 };
      } else {
        sortObj = { [sort]: 1 };
      }
    }

    const total = await Department.countDocuments(filter);
    const departments = await Department.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('parentDepartment', 'name code status')
      .populate('departmentHead', 'name email role status');

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { departments, pagination }, 'Departments fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Department not found');
    }

    const department = await Department.findById(id)
      .populate('parentDepartment', 'name code status')
      .populate('departmentHead', 'name email role status');

    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    res.status(200).json(
      new ApiResponse(200, department, 'Department fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, code, parentDepartment, departmentHead, status } = req.body;

    const existingName = await Department.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existingName) {
      throw new ApiError(409, 'Department with this name already exists');
    }

    const existingCode = await Department.findOne({
      code: code.trim().toUpperCase(),
    });
    if (existingCode) {
      throw new ApiError(409, 'Department with this code already exists');
    }

    if (parentDepartment) {
      if (!mongoose.Types.ObjectId.isValid(parentDepartment)) {
        throw new ApiError(400, 'Invalid parentDepartment ID');
      }
      const parent = await Department.findById(parentDepartment);
      if (!parent) {
        throw new ApiError(404, 'Parent department not found');
      }
    }

    if (departmentHead) {
      if (!mongoose.Types.ObjectId.isValid(departmentHead)) {
        throw new ApiError(400, 'Invalid departmentHead ID');
      }
      const head = await User.findById(departmentHead);
      if (!head) {
        throw new ApiError(404, 'Assigned department head not found');
      }
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      parentDepartment: parentDepartment || null,
      departmentHead: departmentHead || null,
      status: status || STATUS.ACTIVE,
    });

    const populated = await Department.findById(department._id)
      .populate('parentDepartment', 'name code status')
      .populate('departmentHead', 'name email role status');

    logActivity(
      req.user._id,
      'Department Created',
      'Department',
      department._id,
      `Department ${department.name} was created`
    );

    res.status(201).json(
      new ApiResponse(201, populated, 'Department created successfully')
    );
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Department not found');
    }

    const department = await Department.findById(id);
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    const { name, code, parentDepartment, departmentHead, status } = req.body;

    if (name && name.trim().toLowerCase() !== department.name.toLowerCase()) {
      const existingName = await Department.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id },
      });
      if (existingName) {
        throw new ApiError(409, 'Department with this name already exists');
      }
      department.name = name.trim();
    }

    if (code && code.trim().toUpperCase() !== department.code) {
      const existingCode = await Department.findOne({
        code: code.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (existingCode) {
        throw new ApiError(409, 'Department with this code already exists');
      }
      department.code = code.trim().toUpperCase();
    }

    if (parentDepartment !== undefined) {
      if (parentDepartment === null || parentDepartment === '') {
        department.parentDepartment = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(parentDepartment)) {
          throw new ApiError(400, 'Invalid parentDepartment ID');
        }
        if (parentDepartment.toString() === id.toString()) {
          throw new ApiError(400, 'Department cannot be its own parent');
        }
        const parent = await Department.findById(parentDepartment);
        if (!parent) {
          throw new ApiError(404, 'Parent department not found');
        }
        department.parentDepartment = parentDepartment;
      }
    }

    if (departmentHead !== undefined) {
      if (departmentHead === null || departmentHead === '') {
        department.departmentHead = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(departmentHead)) {
          throw new ApiError(400, 'Invalid departmentHead ID');
        }
        const head = await User.findById(departmentHead);
        if (!head) {
          throw new ApiError(404, 'Assigned department head not found');
        }
        department.departmentHead = departmentHead;
      }
    }

    if (status) {
      department.status = status;
    }

    await department.save();

    const populated = await Department.findById(department._id)
      .populate('parentDepartment', 'name code status')
      .populate('departmentHead', 'name email role status');

    res.status(200).json(
      new ApiResponse(200, populated, 'Department updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Department not found');
    }

    const department = await Department.findById(id);
    if (!department) {
      throw new ApiError(404, 'Department not found');
    }

    department.status = STATUS.INACTIVE;
    await department.save();

    res.status(200).json(
      new ApiResponse(200, department, 'Department soft deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
