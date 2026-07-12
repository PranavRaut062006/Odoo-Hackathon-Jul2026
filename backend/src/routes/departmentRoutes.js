const express = require('express');
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const {
  createDepartmentValidator,
  updateDepartmentValidator,
} = require('../validators/departmentValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', createDepartmentValidator, createDepartment);
router.put('/:id', updateDepartmentValidator, updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;
