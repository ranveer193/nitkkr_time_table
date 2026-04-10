const express = require('express');
const router = express.Router();
const {
  getAllTimetables,
  createTimetable,
  getTimetableById,
  deleteTimetable,
  updateCell,
  createValidation
} = require('../controllers/timetableController');
const {
  protect,
  authorize
} = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN'), getAllTimetables);
router.post(
  '/',
  authorize('SUPER_ADMIN'),
  createValidation,
  createTimetable
);
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN'),
  getTimetableById
);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteTimetable);
router.put(
  '/cell/:cellId',
  authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN'),
  updateCell
);

module.exports = router;
