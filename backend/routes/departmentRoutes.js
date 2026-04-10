const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  departmentValidation
} = require('../controllers/departmentController');
const { protect, authorizeAdminOnly } = require('../middleware/auth');

router.get('/', getAllDepartments);

router.use(protect);
router.use(authorizeAdminOnly);
router.post('/', departmentValidation, createDepartment);
router.put('/:id', departmentValidation, updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;
