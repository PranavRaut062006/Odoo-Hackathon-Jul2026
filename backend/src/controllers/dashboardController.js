const Asset = require('../models/Asset');
const Employee = require('../models/User'); // Employee directory is just users
const Department = require('../models/Department');
const TransferRequest = require('../models/TransferRequest');
const Allocation = require('../models/Allocation');
const ActivityLog = require('../models/ActivityLog');
const ApiResponse = require('../utils/ApiResponse');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    // 1. Assets KPIs and Charts using $facet
    const assetAggregations = await Asset.aggregate([
      {
        $facet: {
          totalAssets: [{ $count: 'count' }],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: 'assetcategories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo',
              },
            },
            {
              $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                category: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
                count: 1,
              },
            },
          ],
          byDepartment: [
            {
              $group: {
                _id: '$department',
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: 'departments',
                localField: '_id',
                foreignField: '_id',
                as: 'departmentInfo',
              },
            },
            {
              $unwind: { path: '$departmentInfo', preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                department: { $ifNull: ['$departmentInfo.name', 'No Department'] },
                count: 1,
              },
            },
          ],
        },
      },
    ]);

    const assetData = assetAggregations[0];
    const totalAssets = assetData.totalAssets[0]?.count || 0;

    const statusMap = {};
    assetData.byStatus.forEach((stat) => {
      statusMap[stat._id] = stat.count;
    });

    const availableAssets = statusMap['Available'] || 0;
    const allocatedAssets = statusMap['Allocated'] || 0;
    const maintenanceAssets = statusMap['Under Maintenance'] || 0;
    const disposedAssets = statusMap['Disposed'] || 0;

    // 2. Transfers Distributions
    const transferAggregations = await TransferRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const transferStatusDist = transferAggregations.map((t) => ({ status: t._id, count: t.count }));
    const pendingTransfers = transferStatusDist.find((t) => t.status === 'Pending')?.count || 0;
    const completedTransfers = transferStatusDist.find((t) => t.status === 'Approved')?.count || 0;

    // 3. Allocations Distributions & Return Dates
    const allocationAggregations = await Allocation.aggregate([
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          returns: [
            {
              $match: {
                status: 'Active',
                expectedReturnDate: { $exists: true, $ne: null },
              },
            },
            {
              $project: {
                isOverdue: { $lt: ['$expectedReturnDate', today] },
                isUpcoming: {
                  $and: [
                    { $gte: ['$expectedReturnDate', today] },
                    { $lte: ['$expectedReturnDate', next7Days] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                overdue: { $sum: { $cond: ['$isOverdue', 1, 0] } },
                upcoming: { $sum: { $cond: ['$isUpcoming', 1, 0] } },
              },
            },
          ],
        },
      },
    ]);

    const allocationData = allocationAggregations[0];
    const allocationStatusDist = allocationData.byStatus.map((a) => ({ status: a._id, count: a.count }));
    const activeAllocations = allocationStatusDist.find((a) => a.status === 'Active')?.count || 0;
    const overdueReturns = allocationData.returns[0]?.overdue || 0;
    const upcomingReturns = allocationData.returns[0]?.upcoming || 0;

    // 4. Basic Counts
    const [totalEmployees, totalDepartments, recentActivities] = await Promise.all([
      Employee.countDocuments({ status: 'Active' }), // Count active employees only
      Department.countDocuments({ status: 'Active' }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name'),
    ]);

    // Build Response Structure
    const response = {
      kpis: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        assetsUnderMaintenance: maintenanceAssets,
        disposedAssets,
        totalEmployees,
        totalDepartments,
        pendingTransfers,
        completedTransfers,
        activeAllocations,
        upcomingReturns,
        overdueReturns,
      },
      charts: {
        assetsByCategory: assetData.byCategory,
        assetsByDepartment: assetData.byDepartment,
        assetsByStatus: assetData.byStatus.map((s) => ({ status: s._id, count: s.count })),
        transferStatusDistribution: transferStatusDist,
        allocationStatusDistribution: allocationStatusDist,
      },
      recentActivities,
    };

    res.status(200).json(new ApiResponse(200, response, 'Dashboard metrics fetched successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
