const { validationResult } = require('express-validator');
const ClinicService = require('../services/ClinicService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class ClinicController {
    /**
     * GET /api/v1/clinics
     * Get all clinics (SUPERADMIN only)
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await ClinicService.getAllClinics(page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.clinics,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Clinics retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:id
     * Get clinic by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const clinic = await ClinicService.getClinicById(req.params.id, req.user);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: clinic,
                message: 'Clinic retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/clinics
     * Create new clinic (SUPERADMIN only)
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const clinic = await ClinicService.createClinic(req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: clinic,
                message: 'Clinic created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:id
     * Update clinic
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const clinic = await ClinicService.updateClinic(req.params.id, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: clinic,
                message: 'Clinic updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:id
     * Delete clinic
     */
    static delete = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const result = await ClinicService.deleteClinic(req.params.id);

        // FIX: Check if the deletion actually worked
        if (!result || result.error) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
                apiResponse.error(
                    result.message || 'Could not delete clinic. Ensure it has no linked users.',
                    HTTP_STATUS.INTERNAL_SERVER_ERROR
                )
            );
        }

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message || 'Clinic deleted successfully',
            })
        );
    });
}
module.exports = ClinicController;
