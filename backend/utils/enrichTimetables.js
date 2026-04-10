const mongoose = require('mongoose');
const TimetableCell = require('../models/TimetableCell');

const enrichTimetables = async (timetables) => {
  if (!timetables || timetables.length === 0) {
    return timetables;
  }

  const timetableIds = timetables.map((t) =>
    typeof t._id === 'string' ? new mongoose.Types.ObjectId(t._id) : t._id
  );

  const cellStats = await TimetableCell.aggregate([
    {
      $match: {
        timetableId: { $in: timetableIds },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: '$timetableId',
        totalCells: { $sum: 1 },
        filledCells: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$subject', ''] },
                  { $ne: ['$subject', null] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const statsMap = {};
  for (const stat of cellStats) {
    statsMap[stat._id.toString()] = {
      totalCells: stat.totalCells,
      filledCells: stat.filledCells
    };
  }

  const enriched = timetables.map((t) => {
    const tObj = t.toObject ? t.toObject() : { ...t };
    const id = tObj._id.toString();
    const stats = statsMap[id] || { totalCells: 0, filledCells: 0 };
    tObj.totalCells = stats.totalCells;
    tObj.filledCells = stats.filledCells;
    return tObj;
  });

  return enriched;
};

module.exports = { enrichTimetables };
