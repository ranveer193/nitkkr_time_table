const { validationResult, body } = require('express-validator');
const Timetable = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');
const Department = require('../models/Department');
const Building = require('../models/Building');
const Room = require('../models/Room');
const { enrichTimetables } = require('../utils/enrichTimetables');

const createValidation = [

  body('buildingId')
    .notEmpty()
    .withMessage('Building ID is required')
    .isMongoId()
    .withMessage('Invalid building ID'),
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required')
    .isMongoId()
    .withMessage('Invalid room ID'),
  body('days')
    .isArray({ min: 1, max: 7 })
    .withMessage('Days must be an array of 1–7 items'),
  body('periodsPerDay')
    .isInt({ min: 1, max: 16 })
    .withMessage('Periods per day must be between 1 and 16')
];

const getAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find({ isDeleted: false })
      .populate('building', 'name code')
      .populate('room', 'name floor capacity')
      .populate('createdBy', 'name userId')
      .sort({ createdAt: -1 });

    const enriched = await enrichTimetables(timetables);

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('GetAllTimetables error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching timetables'
    });
  }
};

const createTimetable = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { buildingId, roomId, days, periodsPerDay } = req.body;

    const [building, room] = await Promise.all([
      Building.findById(buildingId),
      Room.findById(roomId)
    ]);

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.building.toString() !== buildingId) {
      return res.status(400).json({ success: false, message: 'Room does not belong to the specified building' });
    }

    const existingTimetable = await Timetable.findOne({ room: roomId, isDeleted: false });
    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: 'A timetable already exists for this room.'
      });
    }

    const title = `${building.name} — ${room.name}`;

    const timetable = await Timetable.create({
      title,
      building: buildingId,
      room: roomId,
      days,
      periodsPerDay,
      createdBy: req.user._id
    });

    const cells = [];
    for (const day of days) {
      for (let period = 1; period <= periodsPerDay; period++) {
        cells.push({
          timetableId: timetable._id,
          day,
          period,
          subject: '',
          department: null,
          history: []
        });
      }
    }

    await TimetableCell.insertMany(cells);

    const populated = await Timetable.findById(timetable._id)
      .populate('building', 'name code')
      .populate('room', 'name floor capacity')
      .populate('createdBy', 'name userId');

    return res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      data: populated
    });
  } catch (err) {
    console.error('CreateTimetable error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error creating timetable'
    });
  }
};

const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('building', 'name code')
      .populate('room', 'name floor capacity')
      .populate('createdBy', 'name userId');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    const cells = await TimetableCell.find({
      timetableId: timetable._id,
      isDeleted: false
    })
      .populate('department', 'name code color')
      .populate('history.previousDepartment', 'name code color')
      .sort({ day: 1, period: 1 })
      .lean();

    const timetableObj = timetable.toObject();
    timetableObj.cells = cells;
    timetableObj.totalCells = cells.length;
    timetableObj.filledCells = cells.filter(
      (c) => c.subject && c.subject.trim() !== ''
    ).length;

    return res.status(200).json({
      success: true,
      data: timetableObj
    });
  } catch (err) {
    console.error('GetTimetableById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching timetable'
    });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    await timetable.deleteOne();
    await TimetableCell.deleteMany({ timetableId: timetable._id });

    return res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (err) {
    console.error('DeleteTimetable error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting timetable'
    });
  }
};

const updateCell = async (req, res) => {
  try {
    const { subject, departmentId } = req.body;

    const cell = await TimetableCell.findById(req.params.cellId);
    if (!cell) {
      return res.status(404).json({
        success: false,
        message: 'Timetable cell not found'
      });
    }

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const isDeptAdmin = req.user.role === 'DEPARTMENT_ADMIN';

    if (isSuperAdmin) {
      // Super Admin: Only assigns department
      if (departmentId === undefined) {
        return res.status(400).json({ success: false, message: 'Department ID is required for assignment' });
      }

      if (departmentId) {
        const targetDept = await Department.findById(departmentId);
        if (!targetDept) {
          return res.status(404).json({ success: false, message: 'Department not found' });
        }
      }

      const prevDeptId = cell.department ? cell.department.toString() : null;
      const targetDeptStr = departmentId || null;

      if (prevDeptId !== targetDeptStr) {
        cell.addHistory(cell.subject, prevDeptId, 'DEPT_ASSIGNMENT', req.user._id, req.user.name);
        cell.department = departmentId || null;
        if (!departmentId) {
          cell.subject = ''; // Clear subject if department unassigned
        }
        await cell.save();
      }

    } else if (isDeptAdmin) {
      // Dept Admin: Only updates subject
      if (subject === undefined || subject === null) {
        return res.status(400).json({ success: false, message: 'Subject is required' });
      }
      if (!cell.department) {
        return res.status(403).json({ success: false, message: 'Cell is not assigned to any department' });
      }
      if (
        !req.user.department ||
        cell.department.toString() !== req.user.department.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit cells belonging to your department'
        });
      }

      const trimmedSubject = subject.trim();
      const previousValue = cell.subject || '';

      if (trimmedSubject !== '') {
        const timetable = await Timetable.findById(cell.timetableId).lean();
        if (!timetable) {
          return res.status(404).json({ success: false, message: 'Parent timetable not found' });
        }

        const clashingCells = await TimetableCell.find({
          department: cell.department,
          day: cell.day,
          period: cell.period,
          subject: { $ne: '', $exists: true },
          isDeleted: false,
          _id: { $ne: cell._id }
        })
          .populate({
            path: 'timetableId',
            select: 'room isDeleted',
            populate: { path: 'room', select: 'name' }
          })
          .lean();

        const activeClashes = clashingCells.filter((c) => c.timetableId && !c.timetableId.isDeleted);
        if (activeClashes.length > 0) {
          const clashRoom = activeClashes[0].timetableId?.room?.name || 'Unknown Room';
          return res.status(409).json({
            success: false,
            hasClash: true,
            message: 'Faculty/department clash detected',
            clashRoom
          });
        }
      }

      if (previousValue !== trimmedSubject) {
        cell.addHistory(previousValue, cell.department, 'VALUE_CHANGE', req.user._id, req.user.name);
        cell.subject = trimmedSubject;
        await cell.save();
      }
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized action on timetable cell' });
    }

    const updated = await TimetableCell.findById(cell._id)
      .populate('department', 'name code color')
      .populate('history.previousDepartment', 'name code color')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Cell updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('UpdateCell error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating cell'
    });
  }
};

module.exports = {
  getAllTimetables,
  createTimetable,
  getTimetableById,
  deleteTimetable,
  updateCell,
  createValidation
};
