const Asset = require('../models/Asset');
const AssetCategory = require('../models/AssetCategory');
const Department = require('../models/Department');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { logActivity } = require('../utils/logger');

// Helper to generate the next asset tag
const generateNextAssetTag = async () => {
  const lastAsset = await Asset.findOne({}, { assetTag: 1 }).sort({ createdAt: -1 });
  let nextNumber = 1;

  if (lastAsset && lastAsset.assetTag && lastAsset.assetTag.startsWith('AF-')) {
    const lastNumberStr = lastAsset.assetTag.split('-')[1];
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format with leading zeros to ensure 4 digits (e.g. AF-0001, AF-0010)
  const formattedNumber = nextNumber.toString().padStart(4, '0');
  return `AF-${formattedNumber}`;
};

const createAsset = async (req, res, next) => {
  try {
    const { category, department, serialNumber } = req.body;

    // Validate if serial number is unique
    const serialExists = await Asset.findOne({ serialNumber });
    if (serialExists) {
      throw new ApiError(409, 'Asset with this serial number already exists');
    }

    // Validate Category exists
    const categoryExists = await AssetCategory.findById(category);
    if (!categoryExists) {
      throw new ApiError(404, 'Asset Category not found');
    }

    // Validate Department exists (if provided)
    if (department) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        throw new ApiError(404, 'Department not found');
      }
    }

    // Auto generate Asset Tag
    const assetTag = await generateNextAssetTag();

    const newAssetData = {
      ...req.body,
      assetTag,
    };

    const asset = await Asset.create(newAssetData);
    
    // Populate for response
    await asset.populate('category', 'name description');
    if (asset.department) {
      await asset.populate('department', 'name code');
    }

    logActivity(
      req.user._id,
      'Asset Created',
      'Asset',
      asset._id,
      `Asset ${asset.name} (${asset.assetTag}) was registered`
    );

    res.status(201).json(new ApiResponse(201, asset, 'Asset created successfully'));
  } catch (error) {
    // Check for Mongoose duplicate key error dynamically
    if (error.code === 11000) {
      next(new ApiError(409, 'Asset with this unique field already exists (Tag or Serial Number)'));
    } else {
      next(error);
    }
  }
};

const getAssets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, department, status, bookable, sort } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    let query = {};

    // Search by Asset Tag, Serial Number, Name, or Location
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { assetTag: searchRegex },
        { serialNumber: searchRegex },
        { name: searchRegex },
        { location: searchRegex },
      ];
    }

    // Filters
    if (category) query.category = category;
    if (department) query.department = department;
    if (status) query.status = status;
    if (bookable !== undefined) query.bookable = bookable === 'true';

    // Sorting
    let sortOption = { createdAt: -1 }; // Default sort
    if (sort) {
      const sortFields = sort.split(',').join(' ');
      sortOption = sortFields;
    }

    const totalAssets = await Asset.countDocuments(query);
    const assets = await Asset.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .populate('category', 'name description')
      .populate('department', 'name code');

    const paginationMetadata = {
      total: totalAssets,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalAssets / limitNumber),
    };

    res.status(200).json({
      success: true,
      message: 'Assets fetched successfully',
      data: assets,
      pagination: paginationMetadata,
    });
  } catch (error) {
    next(error);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('category', 'name description')
      .populate('department', 'name code');

    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    res.status(200).json(new ApiResponse(200, asset, 'Asset fetched successfully'));
  } catch (error) {
    next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    const { category, department, serialNumber } = req.body;

    // Prevent assetTag updates
    if (req.body.assetTag) {
      delete req.body.assetTag;
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    if (serialNumber && serialNumber !== asset.serialNumber) {
      const serialExists = await Asset.findOne({ serialNumber });
      if (serialExists) {
        throw new ApiError(409, 'Asset with this serial number already exists');
      }
    }

    if (category && category.toString() !== asset.category.toString()) {
      const categoryExists = await AssetCategory.findById(category);
      if (!categoryExists) {
        throw new ApiError(404, 'Asset Category not found');
      }
    }

    if (department && (!asset.department || department.toString() !== asset.department.toString())) {
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        throw new ApiError(404, 'Department not found');
      }
    }

    const updatedAsset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('category', 'name description')
      .populate('department', 'name code');

    logActivity(
      req.user._id,
      'Asset Updated',
      'Asset',
      updatedAsset._id,
      `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) was updated`
    );

    res.status(200).json(new ApiResponse(200, updatedAsset, 'Asset updated successfully'));
  } catch (error) {
    next(error);
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      throw new ApiError(404, 'Asset not found');
    }

    // Soft Delete
    asset.status = 'Disposed';
    await asset.save();

    logActivity(
      req.user._id,
      'Asset Deleted (Soft Delete)',
      'Asset',
      asset._id,
      `Asset ${asset.name} (${asset.assetTag}) was soft deleted`
    );

    res.status(200).json(new ApiResponse(200, null, 'Asset soft deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
};
