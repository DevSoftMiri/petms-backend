const { body, param } = require('express-validator');
const { validators } = require('./index');

/**
 * Customer Validators
 */
const customerValidators = {
  create: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    validators.firstName(),
    validators.lastName(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    validators.phoneNumber(),
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
    // Pet validation (optional array)
    body('pets')
      .optional()
      .isArray()
      .withMessage('Pets must be an array'),
    body('pets.*.name')
      .if((value, { req }) => req.body.pets && req.body.pets.length > 0)
      .trim()
      .isLength({ min: 1 })
      .withMessage('Pet name is required'),
    body('pets.*.species')
      .if((value, { req }) => req.body.pets && req.body.pets.length > 0)
      .trim()
      .isLength({ min: 1 })
      .withMessage('Pet species is required'),
    body('pets.*.gender')
      .if((value, { req }) => req.body.pets && req.body.pets.length > 0)
      .optional()
      .trim(),
    body('pets.*.colour')
      .if((value, { req }) => req.body.pets && req.body.pets.length > 0)
      .optional()
      .trim(),
    body('pets.*.breed')
      .optional()
      .trim(),
    body('pets.*.age')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Age must be a positive integer'),
    body('pets.*.weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('pets.*.medicalNotes')
      .optional()
      .trim(),
  ],

  update: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    param('customerId').notEmpty().withMessage('Customer ID is required'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('First name must be at most 100 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Last name must be at most 100 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
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
  ],

  getById: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    param('customerId').notEmpty().withMessage('Customer ID is required'),
  ],

  delete: [
    param('clinicId').notEmpty().withMessage('Clinic ID is required'),
    param('customerId').notEmpty().withMessage('Customer ID is required'),
  ],

  list: [
    validators.page(),
    validators.limit(),
    validators.search(),
  ],
};

module.exports = customerValidators;
