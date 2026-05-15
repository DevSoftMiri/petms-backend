const express = require('express');
const router = express.Router({ mergeParams: true });
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');

/**
 * Dashboard Routes
 * Base: /api/v1/clinics/:clinicId/dashboard
 */

// GET /api/v1/clinics/:clinicId/dashboard
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    DashboardController.getDashboard
);

module.exports = router;
