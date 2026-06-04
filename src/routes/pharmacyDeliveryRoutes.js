const express = require('express');
const router = express.Router({ mergeParams: true });
const PharmacyDeliveryController = require('../controllers/PharmacyDeliveryController');
const authMiddleware = require('../middleware/authMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

/**
 * Pharmacy Delivery Routes
 * Base: /api/v1/clinics/:clinicId/pharmacy/delivery
 */

// POST /api/v1/clinics/:clinicId/pharmacy/delivery
// Create new pharmacy delivery record
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'SUPERADMIN']),
    PharmacyDeliveryController.create
);

// GET /api/v1/clinics/:clinicId/pharmacy/delivery
// Get all pharmacy deliveries for a clinic
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.getAll
);

// GET /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
// Get pharmacy delivery by ID
router.get(
    '/:deliveryId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.getById
);

// PUT /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
// Update pharmacy delivery record
router.put(
    '/:deliveryId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.update
);

// DELETE /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
// Delete pharmacy delivery record
router.delete(
    '/:deliveryId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.delete
);

// GET /api/v1/clinics/:clinicId/pharmacy/delivery/pet/:petId
// Get delivery history for a pet
router.get(
    '/pet/:petId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'VET', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.getDeliveryHistoryByPet
);

// GET /api/v1/clinics/:clinicId/pharmacy/delivery/customer/:customerId
// Get delivery history for a customer
router.get(
    '/customer/:customerId',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['PHARMACIST', 'RECEPTIONIST', 'ADMIN', 'SUPERADMIN']),
    PharmacyDeliveryController.getDeliveryHistoryByCustomer
);

module.exports = router;
