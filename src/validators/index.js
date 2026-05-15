const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Custom validation error handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            errors: errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            })),
        });
    }
    next();
};

/**
 * Reusable field validators
 */
const validators = {
    // String validators
    username: () =>
        body('username')
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage('Username must be between 3 and 20 characters'),

    email: () =>
        body('email')
            .trim()
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail(),

    password: () =>
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number, and special character'),

    firstName: () =>
        body('firstName')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('First name is required and must be at most 100 characters'),

    lastName: () =>
        body('lastName')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Last name is required and must be at most 100 characters'),

    phoneNumber: () =>
        body('phoneNumber')
            .optional()
            .matches(/^[\d\s\-\+\(\)]{10,}$/)
            .withMessage('Invalid phone number format'),

    // ID validators
    id: (paramName = 'id') =>
        param(paramName)
            .notEmpty()
            .withMessage(`${paramName} is required`),

    clinicId: () =>
        body('clinicId')
            .notEmpty()
            .withMessage('Clinic ID is required'),

    // Query validators
    page: () =>
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),

    limit: () =>
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),

    search: () =>
        query('search')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Search query must be at most 255 characters'),
};

module.exports = {
    handleValidationErrors,
    validators,
};
