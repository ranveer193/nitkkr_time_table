const express = require('express');
const router = express.Router();
const {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  roomValidation
} = require('../controllers/roomController');
const { protect, authorizeAdminOnly } = require('../middleware/auth');

router.get('/', getAllRooms);

router.use(protect);
router.use(authorizeAdminOnly);
router.post('/', roomValidation, createRoom);
router.put('/:id', roomValidation, updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;
