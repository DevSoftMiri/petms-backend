const { body, param } = require('express-validator');
const { validators } = require('./index');

/**
 * Pet Validators
 */
const petValidators = {
  create: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    body('customerId')
      .notEmpty()
      .withMessage('Customer ID is required'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Pet name is required'),
    body('species')
      .trim()
      .notEmpty()
      .withMessage('Species is required'),
    body('breed')
      .optional()
      .trim(),
    body('age')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Age must be a non-negative number'),
    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Unknown'])
      .withMessage('Invalid gender'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('color')
      .optional()
      .trim(),
    body('colour')
      .optional()
      .trim(),
    body('medicalNotes')
      .optional()
      .trim(),
    body('microchipId')
      .optional()
      .trim(),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
  ],

  update: [
    param('petId').notEmpty().withMessage('Pet ID is required'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Pet name cannot be empty'),
    body('species')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Species cannot be empty'),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('medicalNotes')
      .optional()
      .trim(),
  ],

  getById: [
    validators.id('id'),
  ],

  delete: [
    validators.id('id'),
  ],

  list: [
    validators.page(),
    validators.limit(),
    validators.search(),
  ],
};

module.exports = petValidators;
