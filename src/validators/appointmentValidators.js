const { body, param } = require('express-validator');
const { validators } = require('./index');

/**
 * Pet Validators
 */
const petValidators = {
  create: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    body().custom((value, { req }) => {
      const hasCustomerId = Boolean(req.body.customerId);
      const hasContactName = Boolean(req.body.rescuerName || req.body.contactName);

      if (!hasCustomerId && !hasContactName) {
        throw new Error('Customer ID or rescuer/contact name is required');
      }

      return true;
    }),
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
    body('formNumber')
      .optional()
      .trim(),
    body('intakeType')
      .optional()
      .isIn(['RESCUE', 'SURRENDER', 'TREATMENT'])
      .withMessage('Invalid intake type'),
    body('rescuerName')
      .optional()
      .trim(),
    body('contactName')
      .optional()
      .trim(),
    body('rescuerPhone')
      .optional()
      .trim(),
    body('rescuerEmail')
      .optional()
      .isEmail()
      .withMessage('Invalid rescuer email format'),
    body('rescuerAddress')
      .optional()
      .trim(),
    body('rescueLocationCondition')
      .optional()
      .trim(),
    body('neutered')
      .optional()
      .isIn(['Yes', 'No', 'Unknown'])
      .withMessage('Invalid neutered value'),
    body('vaccinationStatus')
      .optional()
      .isIn(['Yes', 'No', 'Unknown'])
      .withMessage('Invalid vaccination status'),
    body('medicalHistoryVetDetails')
      .optional()
      .trim(),
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
