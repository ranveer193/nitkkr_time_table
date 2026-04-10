const { validationResult, body } = require('express-validator');
const Department = require('../models/Department');

const departmentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ max: 10 })
    .withMessage('Code cannot exceed 10 characters'),
  body('color').optional().trim()
];

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    console.error('GetAllDepartments error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching departments'
    });
  }
};

const createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, code, color } = req.body;

    const existing = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { code: code.toUpperCase() }
      ],
      isDeleted: false
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name or code already exists'
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      color: color || '#3B82F6'
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (err) {
    console.error('CreateDepartment error:', err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate department name or code'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error creating department'
    });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const { name, code, color } = req.body;

    if (name || code) {
      const conditions = [];
      if (name) {
        conditions.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      }
      if (code) {
        conditions.push({ code: code.toUpperCase() });
      }

      const duplicate = await Department.findOne({
        $or: conditions,
        _id: { $ne: department._id },
        isDeleted: false
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another department with this name or code already exists'
        });
      }
    }

    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (color !== undefined) department.color = color;

    await department.save();

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (err) {
    console.error('UpdateDepartment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error updating department'
    });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (err) {
    console.error('DeleteDepartment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting department'
    });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  departmentValidation
};
