const express = require('express');
const router = express.Router({ mergeParams: true });
const CustomerController = require('../controllers/CustomerController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const customerValidators = require('../validators/customerValidators');
const { handleValidationErrors } = require('../validators/index');

/**
 * Customer Routes
 * Base: /api/v1/clinics/:clinicId/customers
 */

// GET /api/v1/clinics/:clinicId/customers
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_CUSTOMERS'),
    customerValidators.list,
    handleValidationErrors,
    CustomerController.getAll
);

// GET /api/v1/clinics/:clinicId/customers/:customerId
router.get(
    '/:customerId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_CUSTOMERS'),
    CustomerController.getById
);

// POST /api/v1/clinics/:clinicId/customers
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('CREATE_CUSTOMERS'),
    customerValidators.create,
    handleValidationErrors,
    CustomerController.create
);

// PUT /api/v1/clinics/:clinicId/customers/:customerId
router.put(
    '/:customerId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('UPDATE_CUSTOMERS'),
    customerValidators.update,
    handleValidationErrors,
    CustomerController.update
);

// DELETE /api/v1/clinics/:clinicId/customers/:customerId
router.delete(
    '/:customerId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('DELETE_CUSTOMERS'),
    CustomerController.delete
);

module.exports = router;
