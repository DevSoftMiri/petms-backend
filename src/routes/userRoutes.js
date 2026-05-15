const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const userValidators = require('../validators/userValidators');
const { handleValidationErrors } = require('../validators/index');

/**
 * User Routes
 * Base: /api/v1/users
 * SUPERADMIN can manage all users
 * ADMIN can manage users in their clinic
 */

// GET /api/v1/users
router.get(
    '/',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    UserController.getAll
);

// GET /api/v1/users/:id
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    userValidators.getById,
    handleValidationErrors,
    UserController.getById
);

// POST /api/v1/users
router.post(
    '/',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    permissionMiddleware('MANAGE_STAFF'),
    userValidators.create,
    handleValidationErrors,
    UserController.create
);

// PUT /api/v1/users/:id
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    permissionMiddleware('MANAGE_STAFF'),
    userValidators.update,
    handleValidationErrors,
    UserController.update
);

// DELETE /api/v1/users/:id
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    permissionMiddleware('MANAGE_STAFF'),
    userValidators.delete,
    handleValidationErrors,
    UserController.delete
);

// POST /api/v1/users/:userId/permissions
router.post(
    '/:userId/permissions',
    authMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN']),
    permissionMiddleware('MANAGE_PERMISSIONS'),
    userValidators.assignPermission,
    handleValidationErrors,
    UserController.assignPermissions
);

module.exports = router;
