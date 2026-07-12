const express = require('express');
const {
  createTransfer,
  getTransfers,
  getTransferById,
  approveTransfer,
  rejectTransfer,
} = require('../controllers/transferController');
const { createTransferValidator } = require('../validators/transferValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(
    authorize(ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN),
    getTransfers
  )
  .post(
    authorize(ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN),
    createTransferValidator,
    createTransfer
  );

router.route('/:id/approve')
  .put(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD),
    approveTransfer
  );

router.route('/:id/reject')
  .put(
    authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER, ROLES.DEPARTMENT_HEAD),
    rejectTransfer
  );

router.route('/:id')
  .get(
    authorize(ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD, ROLES.ASSET_MANAGER, ROLES.ADMIN),
    getTransferById
  );

module.exports = router;
