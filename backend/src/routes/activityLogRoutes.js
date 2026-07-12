const express = require('express');
const { getActivities, getActivityById } = require('../controllers/activityLogController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.ASSET_MANAGER));

router.get('/', getActivities);
router.get('/:id', getActivityById);

module.exports = router;
