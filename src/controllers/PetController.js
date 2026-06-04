const { validationResult } = require('express-validator');
const PetService = require('../services/PetService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class PetController {
    /**
     * GET /api/v1/clinics/:clinicId/pets
     * Get all pets for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await PetService.getAllPets(req.params.clinicId, page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.pets,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Pets retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pets/:petId
     * Get pet by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const pet = await PetService.getPetById(req.params.clinicId, req.params.petId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: pet,
                message: 'Pet retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/clinics/:clinicId/pets
     * Create new pet
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const pet = await PetService.createPet(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: pet,
                message: 'Pet created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/pets/:petId
     * Update pet
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const pet = await PetService.updatePet(req.params.clinicId, req.params.petId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: pet,
                message: 'Pet updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/pets/:petId
     * Delete pet
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await PetService.deletePet(req.params.clinicId, req.params.petId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/pets/:petId/assign-vet
     * Assign a pet to a veterinarian
     */
    static assignVet = asyncHandler(async (req, res) => {
        const { vetId } = req.body;

        if (!vetId) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Veterinarian ID is required', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR')
            );
        }

        const pet = await PetService.assignVet(req.params.clinicId, req.params.petId, vetId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: pet,
                message: 'Pet assigned to veterinarian successfully',
            })
        );
    });
}

module.exports = PetController;
