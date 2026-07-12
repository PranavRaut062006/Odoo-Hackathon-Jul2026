const express = require('express');
const {
  createAllocation,
  getAllocations,
  getAllocationById,
  returnAllocation,
} = require('../controllers/allocationController');
const {
  createAllocationValidator,
  returnAllocationValidator,
} = require('../validators/allocationValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER));

router.route('/')
  .get(getAllocations)
  .post(createAllocationValidator, createAllocation);

router.route('/:id/return')
  .put(returnAllocationValidator, returnAllocation);

router.route('/:id')
  .get(getAllocationById);

module.exports = router;
