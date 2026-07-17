const express = require('express');
const router = express.Router({ mergeParams: true });
const PrescriptionController = require('../controllers/PrescriptionController');
const authMiddleware = require('../middleware/authMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * Prescription Routes
 * Base: /api/v1/clinics/:clinicId/prescriptions
 */

// GET /api/v1/clinics/:clinicId/prescriptions
// Get all prescriptions for a clinic (with optional petId filter)
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PrescriptionController.getAll
);

// GET /api/v1/clinics/:clinicId/prescriptions/active
// Get active/undelivered prescriptions
router.get(
    '/active',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PrescriptionController.getActive
);

// GET /api/v1/clinics/:clinicId/prescriptions/pet/:petId
// Get prescriptions for a specific pet
router.get(
    '/pet/:petId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PrescriptionController.getByPet
);

// GET /api/v1/clinics/:clinicId/prescriptions/vet/:vetId
// Get prescriptions prescribed by a specific vet
router.get(
    '/vet/:vetId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PrescriptionController.getByVet
);

// GET /api/v1/clinics/:clinicId/prescriptions/:prescriptionId
// Get prescription by ID
router.get(
    '/:prescriptionId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PrescriptionController.getById
);

module.exports = router;
