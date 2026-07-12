const express = require('express');
const {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} = require('../controllers/assetController');
const { createAssetValidator, updateAssetValidator } = require('../validators/assetValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

// Apply protect middleware to all asset routes
router.use(protect);

router
  .route('/')
  .get(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE),
    getAssets
  )
  .post(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
    createAssetValidator,
    createAsset
  );

router
  .route('/:id')
  .get(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD, ROLES.EMPLOYEE),
    getAssetById
  )
  .put(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER),
    updateAssetValidator,
    updateAsset
  )
  .delete(
    authorize(ROLES.ADMIN),
    deleteAsset
  );

module.exports = router;
