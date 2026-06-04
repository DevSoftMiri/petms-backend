const PrescriptionService = require('../services/PrescriptionService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class PrescriptionController {
    /**
     * GET /api/v1/clinics/:clinicId/prescriptions
     * Get all prescriptions for a clinic with optional pet filter
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        // Build filters from query params
        const filters = {};
        if (req.query.petId) filters.petId = req.query.petId;
        if (req.query.search) filters.search = req.query.search;

        const result = await PrescriptionService.getPrescriptionsByClinic(req.params.clinicId, page, limit, filters);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.prescriptions,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Prescriptions retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/prescriptions/:prescriptionId
     * Get prescription by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const prescription = await PrescriptionService.getPrescriptionById(req.params.prescriptionId, req.params.clinicId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: prescription,
                message: 'Prescription retrieved successfully',
            })
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/prescriptions/pet/:petId
     * Get prescriptions for a specific pet
     */
    static getByPet = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const result = await PrescriptionService.getPrescriptionsByPet(req.params.clinicId, req.params.petId, page, limit);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.prescriptions,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Pet prescriptions retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/prescriptions/vet/:vetId
     * Get prescriptions prescribed by a specific vet
     */
    static getByVet = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const result = await PrescriptionService.getPrescriptionsByVet(req.params.clinicId, req.params.vetId, page, limit);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.prescriptions,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Vet prescriptions retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/prescriptions/active
     * Get active/undelivered prescriptions
     */
    static getActive = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const result = await PrescriptionService.getActivePrescriptions(req.params.clinicId, page, limit);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.prescriptions,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Active prescriptions retrieved successfully'
            )
        );
    });
}

module.exports = PrescriptionController;
