const express = require('express');
const router = express.Router({ mergeParams: true });
const PharmacyController = require('../controllers/PharmacyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const { handleValidationErrors } = require('../validators/index');

/**
 * Pharmacy Routes
 * Base: /api/v1/clinics/:clinicId/pharmacy
 */

// GET /api/v1/clinics/:clinicId/pharmacy
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_PHARMACY'),
    PharmacyController.getAll
);

// GET /api/v1/clinics/:clinicId/pharmacy/:recordId
router.get(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_PHARMACY'),
    PharmacyController.getById
);

// POST /api/v1/clinics/:clinicId/pharmacy
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_PHARMACY'),
    PharmacyController.create
);

// PUT /api/v1/clinics/:clinicId/pharmacy/:recordId
router.put(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_PHARMACY'),
    PharmacyController.update
);

// DELETE /api/v1/clinics/:clinicId/pharmacy/:recordId
router.delete(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_PHARMACY'),
    PharmacyController.delete
);

module.exports = router;
