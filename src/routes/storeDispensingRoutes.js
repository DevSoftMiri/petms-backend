const express = require('express');
const router = express.Router({ mergeParams: true });
const StoreDispensingController = require('../controllers/StoreDispensingController');
const authMiddleware = require('../middleware/authMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * Store Dispensing Routes
 * Base: /api/v1/clinics/:clinicId/store/dispense
 */

// POST /api/v1/clinics/:clinicId/store/dispense
// Create new store dispensing record
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'STAFF', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.create
);

// GET /api/v1/clinics/:clinicId/store/dispense
// Get all store dispensings for a clinic
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'STAFF', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.getAll
);

// GET /api/v1/clinics/:clinicId/store/dispense/summary
// Get dispensing summary
router.get(
    '/summary',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'STAFF', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.getSummary
);

// GET /api/v1/clinics/:clinicId/store/dispense/:dispensingId
// Get store dispensing by ID
router.get(
    '/:dispensingId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'STAFF', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.getById
);

// PUT /api/v1/clinics/:clinicId/store/dispense/:dispensingId
// Update store dispensing record
router.put(
    '/:dispensingId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'STAFF', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.update
);

// DELETE /api/v1/clinics/:clinicId/store/dispense/:dispensingId
// Delete store dispensing record
router.delete(
    '/:dispensingId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'ADMIN', 'SUPERADMIN']),
    StoreDispensingController.delete
);

module.exports = router;
