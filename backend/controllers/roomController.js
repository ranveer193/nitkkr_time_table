const { validationResult, body } = require('express-validator');
const Room = require('../models/Room');
const Building = require('../models/Building');
const Timetable = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');

const roomValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Room name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('buildingId')
    .notEmpty()
    .withMessage('Building ID is required')
    .isMongoId()
    .withMessage('Invalid building ID'),
  body('capacity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Capacity must be a non-negative integer'),
  body('floor')
    .optional()
    .isInt()
    .withMessage('Floor must be an integer')
];

const getAllRooms = async (req, res) => {
  try {
    const filter = { isDeleted: false };

    if (req.query.buildingId) {
      filter.building = req.query.buildingId;
    }

    const rooms = await Room.find(filter)
      .populate('building', 'name code')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (err) {
    console.error('GetAllRooms error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching rooms'
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, buildingId, capacity, floor } = req.body;

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    const existing = await Room.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      building: buildingId,
      isDeleted: false
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A room with this name already exists in this building'
      });
    }

    const room = await Room.create({
      name,
      building: buildingId,
      capacity: capacity || 0,
      floor: floor || 0
    });

    const populated = await Room.findById(room._id)
      .populate('building', 'name code')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: populated
    });
  } catch (err) {
    console.error('CreateRoom error:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A room with this name already exists in this building'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error creating room'
    });
  }
};

const updateRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const { name, buildingId, capacity, floor } = req.body;

    const targetBuilding = buildingId || room.building;

    if (name) {
      const duplicate = await Room.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        building: targetBuilding,
        _id: { $ne: room._id },
        isDeleted: false
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another room with this name already exists in this building'
        });
      }
    }

    if (buildingId) {
      const building = await Building.findById(buildingId);
      if (!building) {
        return res.status(404).json({
          success: false,
          message: 'Building not found'
        });
      }
      room.building = buildingId;
    }

    if (name) room.name = name;
    if (capacity !== undefined) room.capacity = capacity;
    if (floor !== undefined) room.floor = floor;

    await room.save();

    const populated = await Room.findById(room._id)
      .populate('building', 'name code')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: populated
    });
  } catch (err) {
    console.error('UpdateRoom error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating room'
    });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Hard-delete the room
    await room.deleteOne();

    // Cascade: hard-delete all timetables for this room
    const timetablesToDelete = await Timetable.find({ room: room._id }).select('_id').lean();

    const timetableIds = timetablesToDelete.map(t => t._id);
    let timetableCount = 0;

    if (timetableIds.length > 0) {
      const ttResult = await Timetable.deleteMany({ _id: { $in: timetableIds } });
      timetableCount = ttResult.deletedCount || 0;

      // Cascade: hard-delete all timetable cells linked to those timetables
      await TimetableCell.deleteMany({ timetableId: { $in: timetableIds } });
    }

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      cascade: {
        timetablesDeleted: timetableCount
      }
    });
  } catch (err) {
    console.error('DeleteRoom error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting room'
    });
  }
};

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  roomValidation
};
