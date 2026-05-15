const { validationResult } = require('express-validator');
const GroomingService = require('../services/GroomingService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class GroomingController {
    /**
     * GET /api/v1/clinics/:clinicId/grooming
     * Get all grooming records for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await GroomingService.getAllGroomingRecords(req.params.clinicId, page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.records,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Grooming records retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/grooming/:recordId
     * Get grooming record by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const record = await GroomingService.getGroomingRecordById(req.params.clinicId, req.params.recordId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: record,
                message: 'Grooming record retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/clinics/:clinicId/grooming
     * Create new grooming record
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const record = await GroomingService.createGroomingRecord(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: record,
                message: 'Grooming record created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/grooming/:recordId
     * Update grooming record
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const record = await GroomingService.updateGroomingRecord(req.params.clinicId, req.params.recordId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: record,
                message: 'Grooming record updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/grooming/:recordId
     * Delete grooming record
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await GroomingService.deleteGroomingRecord(req.params.clinicId, req.params.recordId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });
}

module.exports = GroomingController;
