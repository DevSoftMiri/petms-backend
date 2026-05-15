const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');
const authValidators = require('../validators/authValidators');
const { handleValidationErrors } = require('../validators/index');

/**
 * Authentication Routes
 * Base: /api/v1/auth
 */

// POST /api/v1/auth/signup
router.post(
    '/signup',
    authValidators.signup,
    handleValidationErrors,
    AuthController.signup
);

// POST /api/v1/auth/login
router.post(
    '/login',
    authValidators.login,
    handleValidationErrors,
    AuthController.login
);

// POST /api/v1/auth/logout
router.post(
    '/logout',
    authMiddleware,
    AuthController.logout
);

// POST /api/v1/auth/refresh-token
router.post(
    '/refresh-token',
    authMiddleware,
    authValidators.refreshToken,
    handleValidationErrors,
    AuthController.refreshToken
);

// PUT /api/v1/auth/change-password
router.put(
    '/change-password',
    authMiddleware,
    authValidators.changePassword,
    handleValidationErrors,
    AuthController.changePassword
);

// GET /api/v1/auth/me
router.get(
    '/me',
    authMiddleware,
    AuthController.getProfile
);

module.exports = router;
