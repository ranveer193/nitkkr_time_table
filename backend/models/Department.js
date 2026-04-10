const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [10, 'Department code cannot exceed 10 characters']
    },
    color: {
      type: String,
      default: '#3B82F6',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
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

departmentSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted) {
    return next();
  }
  this.where({ isDeleted: { $ne: true } });
  next();
});

departmentSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Department', departmentSchema);
