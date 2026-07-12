const express = require('express');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require('../validators/categoryValidator');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', createCategoryValidator, createCategory);
router.put('/:id', updateCategoryValidator, updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
