const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  promoteEmployee,
} = require('../controllers/employeeController');
const {
  updateEmployeeValidator,
  promoteEmployeeValidator,
} = require('../validators/employeeValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

router.get('/', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), getEmployees);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), getEmployeeById);
router.put('/:id/promote', authorize(ROLES.ADMIN), promoteEmployeeValidator, promoteEmployee);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), updateEmployeeValidator, updateEmployee);

module.exports = router;
