const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Building name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Building code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: [10, 'Building code cannot exceed 10 characters']
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

buildingSchema.pre(/^find/, function (next) {
  if (this.getOptions().includeDeleted) {
    return next();
  }
  this.where({ isDeleted: { $ne: true } });
  next();
});

buildingSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Building', buildingSchema);
