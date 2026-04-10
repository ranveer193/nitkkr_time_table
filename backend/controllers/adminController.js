const User = require('../models/User');
const Department = require('../models/Department');
const Building = require('../models/Building');
const Room = require('../models/Room');
const Timetable = require('../models/Timetable');
const { sendApprovalEmail } = require('../utils/email');

const getStats = async (req, res) => {
  try {
    const [
      totalDepartments,
      totalBuildings,
      totalRooms,
      totalTimetables,
      pendingAdmins,
      activeAdmins,
      disabledAdmins
    ] = await Promise.all([
      Department.countDocuments({ isDeleted: false }),
      Building.countDocuments({ isDeleted: false }),
      Room.countDocuments({ isDeleted: false }),
      Timetable.countDocuments({ isDeleted: false }),
      User.countDocuments({
        role: 'PENDING',
        isDeleted: false
      }),
      User.countDocuments({
        role: 'DEPARTMENT_ADMIN',
        isApproved: true,
        isActive: true,
        isDeleted: false
      }),
      User.countDocuments({
        role: 'DEPARTMENT_ADMIN',
        isActive: false,
        isDeleted: false
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalDepartments,
        totalBuildings,
        totalRooms,
        totalTimetables,
        pendingAdmins,
        activeAdmins,
        disabledAdmins
      }
    });
  } catch (err) {
    console.error('GetStats error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching stats'
    });
  }
};

const getPendingAdmins = async (req, res) => {
  try {
    const pending = await User.findPending();
    return res.status(200).json({
      success: true,
      count: pending.length,
      data: pending
    });
  } catch (err) {
    console.error('GetPending error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching pending admins'
    });
  }
};

const getActiveAdmins = async (req, res) => {
  try {
    const admins = await User.findAdmins({
      isApproved: true,
      isActive: true
    });
    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    console.error('GetActiveAdmins error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching active admins'
    });
  }
};

const getDisabledAdmins = async (req, res) => {
  try {
    const admins = await User.findAdmins({
      isActive: false
    });
    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (err) {
    console.error('GetDisabledAdmins error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching disabled admins'
    });
  }
};

const approveAdmin = async (req, res) => {
  try {
    const { departmentId } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required for approval'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User is not in pending state'
      });
    }

    user.role = 'DEPARTMENT_ADMIN';
    user.department = departmentId;
    user.isApproved = true;
    user.isActive = true;
    await user.save();

    sendApprovalEmail({
      name: user.name,
      email: user.email,
      departmentName: department.name
    });

    return res.status(200).json({
      success: true,
      message: `${user.name} approved as Department Admin for ${department.name}`,
      data: user
    });
  } catch (err) {
    console.error('ApproveAdmin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error approving admin'
    });
  }
};

const rejectAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User is not in pending state'
      });
    }

    await user.softDelete();

    return res.status(200).json({
      success: true,
      message: `Registration request from ${user.name} has been rejected`
    });
  } catch (err) {
    console.error('RejectAdmin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting admin'
    });
  }
};

const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot toggle Super Admin status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.name} has been ${user.isActive ? 'enabled' : 'disabled'}`,
      data: {
        id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('ToggleAdmin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error toggling admin'
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Super Admin'
      });
    }

    await user.softDelete();

    return res.status(200).json({
      success: true,
      message: `${user.name} has been deleted`
    });
  } catch (err) {
    console.error('DeleteAdmin error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting admin'
    });
  }
};

module.exports = {
  getStats,
  getPendingAdmins,
  getActiveAdmins,
  getDisabledAdmins,
  approveAdmin,
  rejectAdmin,
  toggleAdmin,
  deleteAdmin
};
