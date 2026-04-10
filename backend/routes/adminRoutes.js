const express = require('express');
const router = express.Router();
const {
  getStats,
  getPendingAdmins,
  getActiveAdmins,
  getDisabledAdmins,
  approveAdmin,
  rejectAdmin,
  toggleAdmin,
  deleteAdmin
} = require('../controllers/adminController');
const { protect, authorizeAdminOnly } = require('../middleware/auth');

router.use(protect);
router.use(authorizeAdminOnly);

router.get('/stats', getStats);
router.get('/pending', getPendingAdmins);
router.get('/active-admins', getActiveAdmins);
router.get('/disabled-admins', getDisabledAdmins);
router.put('/approve/:id', approveAdmin);
router.delete('/reject/:id', rejectAdmin);
router.put('/toggle/:id', toggleAdmin);
router.delete('/delete-admin/:id', deleteAdmin);

module.exports = router;
