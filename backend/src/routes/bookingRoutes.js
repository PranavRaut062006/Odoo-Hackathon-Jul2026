const express = require('express');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const {
  createBookingValidator,
  updateBookingValidator,
} = require('../validators/bookingValidator');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(createBookingValidator, createBooking)
  .get(getBookings);

router
  .route('/:id')
  .get(getBookingById)
  .put(updateBookingValidator, updateBooking)
  .delete(deleteBooking);

module.exports = router;
