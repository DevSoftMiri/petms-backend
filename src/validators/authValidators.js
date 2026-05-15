const { body } = require('express-validator');
const { validators } = require('./index');

/**
 * Authentication Validators
 */
const authValidators = {
    signup: [
        validators.username(),
        validators.email(),
        validators.password(),
        validators.firstName(),
        validators.lastName(),
        body('role')
            .optional()
            .isIn(['ADMIN', 'VET', 'GROOMER', 'RECEPTIONIST', 'PHARMACIST', 'STAFF'])
            .withMessage('Invalid role'),
        validators.phoneNumber(),
    ],

    login: [
        body('username')
            .notEmpty()
            .withMessage('Username is required'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],

    refreshToken: [
        body('refreshToken')
            .notEmpty()
            .withMessage('Refresh token is required'),
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        validators.password(),
    ],
};

module.exports = authValidators;
