const express = require('express');
const router = express.Router({ mergeParams: true });
const GroomingController = require('../controllers/GroomingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const { handleValidationErrors } = require('../validators/index');

/**
 * Grooming Routes
 * Base: /api/v1/clinics/:clinicId/grooming
 */

// GET /api/v1/clinics/:clinicId/grooming
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_GROOMING'),
    GroomingController.getAll
);

// GET /api/v1/clinics/:clinicId/grooming/:recordId
router.get(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_GROOMING'),
    GroomingController.getById
);

// POST /api/v1/clinics/:clinicId/grooming
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_GROOMING'),
    GroomingController.create
);

// PUT /api/v1/clinics/:clinicId/grooming/:recordId
router.put(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_GROOMING'),
    GroomingController.update
);

// DELETE /api/v1/clinics/:clinicId/grooming/:recordId
router.delete(
    '/:recordId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('MANAGE_GROOMING'),
    GroomingController.delete
);

module.exports = router;
