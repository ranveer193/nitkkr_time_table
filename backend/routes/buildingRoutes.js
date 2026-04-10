const express = require('express');
const router = express.Router();
const {
  getAllBuildings,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  buildingValidation
} = require('../controllers/buildingController');
const { protect, authorizeAdminOnly } = require('../middleware/auth');

router.get('/', getAllBuildings);

router.use(protect);
router.use(authorizeAdminOnly);
router.post('/', buildingValidation, createBuilding);
router.put('/:id', buildingValidation, updateBuilding);
router.delete('/:id', deleteBuilding);

module.exports = router;
