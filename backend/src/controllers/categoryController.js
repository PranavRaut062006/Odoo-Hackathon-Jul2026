const mongoose = require('mongoose');
const AssetCategory = require('../models/AssetCategory');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { STATUS } = require('../constants');
const { logActivity } = require('../utils/logger');

const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, sort, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
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

    const total = await AssetCategory.countDocuments(filter);
    const categories = await AssetCategory.find(filter)
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
      new ApiResponse(200, { categories, pagination }, 'Categories fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Category not found');
    }

    const category = await AssetCategory.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    res.status(200).json(
      new ApiResponse(200, category, 'Category fetched successfully')
    );
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, status } = req.body;

    const existingName = await AssetCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existingName) {
      throw new ApiError(409, 'Category with this name already exists');
    }

    const category = await AssetCategory.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status || STATUS.ACTIVE,
    });

    logActivity(
      req.user._id,
      'Category Created',
      'AssetCategory',
      category._id,
      `Category ${category.name} was created`
    );

    res.status(201).json(
      new ApiResponse(201, category, 'Category created successfully')
    );
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Category not found');
    }

    const category = await AssetCategory.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    const { name, description, status } = req.body;

    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existingName = await AssetCategory.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id },
      });
      if (existingName) {
        throw new ApiError(409, 'Category with this name already exists');
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    if (status) {
      category.status = status;
    }

    await category.save();

    res.status(200).json(
      new ApiResponse(200, category, 'Category updated successfully')
    );
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(404, 'Category not found');
    }

    const category = await AssetCategory.findById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    category.status = STATUS.INACTIVE;
    await category.save();

    res.status(200).json(
      new ApiResponse(200, category, 'Category soft deleted successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
