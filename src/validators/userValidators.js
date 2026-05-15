const { body, param } = require('express-validator');
const { validators } = require('./index');

/**
 * User Validators
 */
const userValidators = {
  create: [
    body('clinicId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Clinic ID cannot be empty if provided'),
    validators.username(),
    validators.email(),
    validators.password(),
    validators.firstName(),
    validators.lastName(),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['SUPERADMIN', 'ADMIN', 'VET', 'GROOMER', 'RECEPTIONIST', 'PHARMACIST', 'STAFF', 'USER'])
      .withMessage('Invalid role'),
    validators.phoneNumber(),
  ],

  update: [
    param('id').notEmpty().withMessage('User ID is required'),
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('clinicId')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Clinic ID cannot be empty if provided'),
    validators.phoneNumber(),
    body('role')
      .optional()
      .isIn(['SUPERADMIN', 'ADMIN', 'VET', 'GROOMER', 'RECEPTIONIST', 'PHARMACIST', 'STAFF', 'USER'])
      .withMessage('Invalid role'),
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

  assignPermission: [
    param('userId').notEmpty().withMessage('User ID is required'),
    body('permissionIds')
      .isArray({ min: 1 })
      .withMessage('Permission IDs must be a non-empty array'),
  ],
};

module.exports = userValidators;
