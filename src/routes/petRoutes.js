const express = require('express');
const router = express.Router({ mergeParams: true });
const PetController = require('../controllers/PetController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const clinicAccessMiddleware = require('../middleware/clinicAccessMiddleware');
const petValidators = require('../validators/appointmentValidators');
const { handleValidationErrors } = require('../validators/index');

/**
 * Pet Routes
 * Base: /api/v1/clinics/:clinicId/pets
 */

// GET /api/v1/clinics/:clinicId/pets
router.get(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_PETS'),
    petValidators.list,
    handleValidationErrors,
    PetController.getAll
);

// GET /api/v1/clinics/:clinicId/pets/:petId
router.get(
    '/:petId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('VIEW_PETS'),
    PetController.getById
);

// POST /api/v1/clinics/:clinicId/pets
router.post(
    '/',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('CREATE_PETS'),
    petValidators.create,
    handleValidationErrors,
    PetController.create
);

// PUT /api/v1/clinics/:clinicId/pets/:petId
router.put(
    '/:petId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('UPDATE_PETS'),
    petValidators.update,
    handleValidationErrors,
    PetController.update
);

// DELETE /api/v1/clinics/:clinicId/pets/:petId
router.delete(
    '/:petId',
    authMiddleware,
    clinicAccessMiddleware,
    permissionMiddleware('DELETE_PETS'),
    PetController.delete
);

// PUT /api/v1/clinics/:clinicId/pets/:petId/assign-vet - Assign pet to a vet
router.put(
    '/:petId/assign-vet',
    authMiddleware,
    clinicAccessMiddleware,
    roleMiddleware(['SUPERADMIN', 'ADMIN', 'VET']),
    PetController.assignVet
);

module.exports = router;
