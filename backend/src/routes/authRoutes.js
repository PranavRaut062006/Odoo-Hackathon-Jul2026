const express = require('express');
const { signup, login, profile } = require('../controllers/authController');
const { signupValidator, loginValidator } = require('../validators/authValidator');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.get('/profile', protect, profile);

module.exports = router;
