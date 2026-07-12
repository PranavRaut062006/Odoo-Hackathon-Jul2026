const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { ROLES, STATUS } = require('../constants');

const getEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort, department, role, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) {
      const deptVal = department.trim();
      const deptMatches = [deptVal];
      if (mongoose.Types.ObjectId.isValid(deptVal)) {
        const deptDoc = await Department.findById(deptVal);
        if (deptDoc) {
          deptMatches.push(deptDoc.name, deptDoc.code);
        }
      } else {
        const deptDoc = await Department.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${deptVal}$`, 'i') } },
            { code: deptVal.toUpperCase() },
          ],
        });
        if (deptDoc) {
          deptMatches.push(deptDoc._id.toString(), deptDoc.name, deptDoc.code);
        }
      }
      filter.department = { $in: [...new Set(deptMatches)] };
    }

    if (role) {
      filter.role = role;
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

    const total = await User.countDocuments(filter);
    const employees = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };

    res.status(200).json(
      new ApiResponse(200, { employees, pagination }, 'Employees fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Employee not found');
    }

    const employee = await User.findById(id).select('-password');
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    res.status(200).json(
      new ApiResponse(200, employee, 'Employee fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Employee not found');
    }

    const employee = await User.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const { name, email, department, status, role } = req.body;

    if (role && role !== employee.role && req.user.role !== ROLES.ADMIN) {
      throw new ApiError(403, 'Only Admin can promote or change employee roles');
    }

    if (email && email.trim().toLowerCase() !== employee.email) {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });
      if (existingEmail) {
        throw new ApiError(409, 'User with this email already exists');
      }
      employee.email = email.trim().toLowerCase();
    }

    if (name) {
      employee.name = name.trim();
    }

    if (department !== undefined) {
      employee.department = department;
    }

    if (status) {
      employee.status = status;
    }

    if (role && req.user.role === ROLES.ADMIN) {
      if (!Object.values(ROLES).includes(role)) {
        throw new ApiError(400, `Role must be one of ${Object.values(ROLES).join(', ')}`);
      }
      employee.role = role;
    }

    await employee.save();

    const updated = await User.findById(employee._id).select('-password');

    res.status(200).json(
      new ApiResponse(200, updated, 'Employee updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const promoteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Employee not found');
    }

    const employee = await User.findById(id);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const { role, department, status } = req.body;

    if (!role || !Object.values(ROLES).includes(role)) {
      throw new ApiError(400, `Valid role is required (${Object.values(ROLES).join(', ')})`);
    }

    employee.role = role;

    if (department !== undefined) {
      employee.department = department;
    }

    if (status) {
      employee.status = status;
    }

    await employee.save();

    const updated = await User.findById(employee._id).select('-password');

    res.status(200).json(
      new ApiResponse(200, updated, 'Employee role promoted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  promoteEmployee,
};
