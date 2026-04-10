const { validationResult, body } = require('express-validator');
const Building = require('../models/Building');
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');

const buildingValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Building name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Building code is required')
    .isLength({ max: 10 })
    .withMessage('Code cannot exceed 10 characters')
];

const getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: buildings.length,
      data: buildings
    });
  } catch (err) {
    console.error('GetAllBuildings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching buildings'
    });
  }
};

const createBuilding = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code } = req.body;

    const existing = await Building.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: code.toUpperCase() }
      ],
      isDeleted: false
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Building with this name or code already exists'
      });
    }

    const building = await Building.create({
      name,
      code: code.toUpperCase()
    });

    return res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building
    });
  } catch (err) {
    console.error('CreateBuilding error:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate building name or code'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error creating building'
    });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    const { name, code } = req.body;

    if (name || code) {
      const conditions = [];
      if (name) {
        conditions.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }
      if (code) {
        conditions.push({ code: code.toUpperCase() });
      }

      const duplicate = await Building.findOne({
        $or: conditions,
        _id: { $ne: building._id },
        isDeleted: false
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another building with this name or code already exists'
        });
      }
    }

    if (name) building.name = name;
    if (code) building.code = code.toUpperCase();

    await building.save();

    return res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      data: building
    });
  } catch (err) {
    console.error('UpdateBuilding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating building'
    });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id);
    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found'
      });
    }

    // Hard-delete the building
    await building.deleteOne();

    // Cascade: hard-delete all rooms in this building
    const roomResult = await Room.deleteMany({ building: building._id });

    // Cascade: hard-delete all timetables in this building
    const timetablesToDelete = await Timetable.find({ building: building._id }).select('_id').lean();

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
      message: 'Building deleted successfully',
      cascade: {
        roomsDeleted: roomResult.deletedCount || 0,
        timetablesDeleted: timetableCount
      }
    });
  } catch (err) {
    console.error('DeleteBuilding error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting building'
    });
  }
};

module.exports = {
  getAllBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  buildingValidation
};
