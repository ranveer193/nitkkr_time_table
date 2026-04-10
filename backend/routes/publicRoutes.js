const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const TimetableCell = require('../models/TimetableCell');
const { enrichTimetables } = require('../utils/enrichTimetables');

router.get('/timetables', async (req, res) => {
  try {
    const timetables = await Timetable.find({ isDeleted: false })
      .populate('building', 'name code')
      .populate('room', 'name floor capacity')
      .sort({ createdAt: -1 });

    const enriched = await enrichTimetables(timetables);

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('Public GetTimetables error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching timetables'
    });
  }
});

router.get('/timetable/:id', async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('building', 'name code')
      .populate('room', 'name floor capacity');

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
    console.error('Public GetTimetableById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching timetable'
    });
  }
});

module.exports = router;
