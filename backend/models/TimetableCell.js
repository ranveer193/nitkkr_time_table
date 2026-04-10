const mongoose = require('mongoose');

const historyItemSchema = new mongoose.Schema(
  {
    previousValue: {
      type: String,
      default: ''
    },
    previousDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    action: {
      type: String,
      enum: ['VALUE_CHANGE', 'DEPT_ASSIGNMENT'],
      default: 'VALUE_CHANGE'
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editedByName: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const timetableCellSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      required: [true, 'Timetable reference is required']
    },
    day: {
      type: String,
      required: [true, 'Day is required']
    },
    period: {
      type: Number,
      required: [true, 'Period is required'],
      min: [1, 'Period must be at least 1']
    },
    subject: {
      type: String,
      default: '',
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    history: {
      type: [historyItemSchema],
      default: []
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

timetableCellSchema.methods.addHistory = function (
  previousValue,
  previousDepartment,
  action,
  editedBy,
  editedByName
) {
  this.history.push({
    previousValue,
    previousDepartment,
    action,
    editedBy,
    editedByName,
    timestamp: new Date()
  });
  if (this.history.length > 5) {
    this.history = this.history.slice(-5);
  }
};

timetableCellSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted) {
    return next();
  }
  this.where({ isDeleted: { $ne: true } });
  next();
});

timetableCellSchema.index({ timetableId: 1 });
timetableCellSchema.index({ timetableId: 1, day: 1, period: 1 });

module.exports = mongoose.model('TimetableCell', timetableCellSchema);
