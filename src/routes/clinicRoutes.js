const express = require('express');
const router = express.Router();
const ClinicController = require('../controllers/ClinicController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const clinicValidators = require('../validators/clinicValidators');
const { handleValidationErrors } = require('../validators/index');

/**
 * Clinic Routes
 * Base: /api/v1/clinics
 * SUPERADMIN only
 */

// GET /api/v1/clinics
router.get(
    '/',
    authMiddleware,
    roleMiddleware(['SUPERADMIN']),
    ClinicController.getAll
);

// GET /api/v1/clinics/:id
router.get(
    '/:id',
    authMiddleware,
    clinicValidators.getById,
    handleValidationErrors,
    ClinicController.getById
);

// POST /api/v1/clinics
router.post(
    '/',
    authMiddleware,
    roleMiddleware(['SUPERADMIN']),
    clinicValidators.create,
    handleValidationErrors,
    ClinicController.create
);

// PUT /api/v1/clinics/:id
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['SUPERADMIN']),
    clinicValidators.update,
    handleValidationErrors,
    ClinicController.update
);

// DELETE /api/v1/clinics/:id
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['SUPERADMIN']),
    clinicValidators.delete,
    handleValidationErrors,
    ClinicController.delete
);

module.exports = router;
