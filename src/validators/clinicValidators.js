const { body, param } = require('express-validator');
const { validators } = require('./index');

/**
 * Clinic Validators
 */
const clinicValidators = {
  create: [
    body('clinicName')
      .trim()
      .notEmpty()
      .withMessage('Clinic name is required'),
    body('clinicCode')
      .trim()
      .notEmpty()
      .withMessage('Clinic code is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Clinic code must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phoneNumber')
      .optional()
      .matches(/^[\d\s\-\+\(\)]{10,}$/)
      .withMessage('Invalid phone number format'),
    body('address')
      .optional()
      .trim(),
    body('city')
      .optional()
      .trim(),
    body('state')
      .optional()
      .trim(),
    body('zipCode')
      .optional()
      .trim(),
    body('country')
      .optional()
      .trim(),
    body('licenseNumber')
      .optional()
      .trim(),
    body('subscriptionPlan')
      .optional()
      .isIn(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
      .withMessage('Invalid subscription plan'),
    body('maxUsers')
      .optional()
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Max users must be a positive integer'),
  ],

  update: [
    param('id').notEmpty().withMessage('Clinic ID is required'),
    body('clinicName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Clinic name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    validators.phoneNumber(),
    body('subscriptionPlan')
      .optional()
      .isIn(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
      .withMessage('Invalid subscription plan'),
    body('maxUsers')
      .optional()
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Max users must be a positive integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  getById: [
    validators.id('id'),
  ],

  delete: [
    validators.id('id'),
  ],
};

module.exports = clinicValidators;
