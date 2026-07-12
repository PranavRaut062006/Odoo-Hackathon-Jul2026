const express = require('express');
const {
  createMaintenance,
  getMaintenance,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
} = require('../controllers/maintenanceController');
const { protect } = require('../middlewares/authMiddleware');
const {
  createMaintenanceValidator,
  updateMaintenanceValidator,
} = require('../validators/maintenanceValidator');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createMaintenanceValidator, createMaintenance)
  .get(getMaintenance);

router
  .route('/:id')
  .get(getMaintenanceById)
  .put(updateMaintenanceValidator, updateMaintenance)
  .delete(deleteMaintenance);

module.exports = router;
