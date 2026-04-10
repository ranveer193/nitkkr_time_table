const mongoose = require('mongoose');

const VALID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const timetableSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Building',
      required: [true, 'Building is required']
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required']
    },
    days: {
      type: [String],
      required: [true, 'Days are required'],
      validate: {
        validator: function (arr) {
          if (arr.length < 1 || arr.length > 7) return false;
          return arr.every((d) => VALID_DAYS.includes(d));
        },
        message:
          'Days must contain 1–7 valid day names (Monday through Sunday)'
      }
    },
    periodsPerDay: {
      type: Number,
      required: [true, 'Periods per day is required'],
      min: [1, 'Must have at least 1 period'],
      max: [16, 'Cannot exceed 16 periods per day']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

timetableSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted) {
    return next();
  }
  this.where({ isDeleted: { $ne: true } });
  next();
});

timetableSchema.index({ building: 1 });
timetableSchema.index({ room: 1 });
timetableSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
module.exports.VALID_DAYS = VALID_DAYS;
