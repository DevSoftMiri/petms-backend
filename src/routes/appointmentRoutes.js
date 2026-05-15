const express = require('express');
const router = express.Router({ mergeParams: true });
const AppointmentController = require('../controllers/AppointmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const { handleValidationErrors } = require('../validators/index');

/**
 * Appointment Routes
 * Base: /api/v1/clinics/:clinicId/appointments
 */

// GET /api/v1/clinics/:clinicId/appointments
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_APPOINTMENTS'),
    AppointmentController.getAll
);

// GET /api/v1/clinics/:clinicId/appointments/:appointmentId
router.get(
    '/:appointmentId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_APPOINTMENTS'),
    AppointmentController.getById
);

// POST /api/v1/clinics/:clinicId/appointments
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('CREATE_APPOINTMENTS'),
    AppointmentController.create
);

// PUT /api/v1/clinics/:clinicId/appointments/:appointmentId
router.put(
    '/:appointmentId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('UPDATE_APPOINTMENTS'),
    AppointmentController.update
);

// PATCH /api/v1/clinics/:clinicId/appointments/:appointmentId/cancel
router.patch(
    '/:appointmentId/cancel',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('CANCEL_APPOINTMENTS'),
    AppointmentController.cancel
);

// DELETE /api/v1/clinics/:clinicId/appointments/:appointmentId
router.delete(
    '/:appointmentId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('CANCEL_APPOINTMENTS'),
    AppointmentController.delete
);

module.exports = router;
