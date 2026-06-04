const { validationResult } = require('express-validator');
const PharmacyService = require('../services/PharmacyService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class PharmacyController {
    /**
     * GET /api/v1/clinics/:clinicId/pharmacy
     * Get all pharmacy inventory items for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await PharmacyService.getAllPharmacyRecords(req.params.clinicId, page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.records,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Pharmacy inventory retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pharmacy/:recordId
     * Get pharmacy inventory item by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const record = await PharmacyService.getPharmacyRecordById(req.params.clinicId, req.params.recordId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: record,
                message: 'Medicine retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/clinics/:clinicId/pharmacy
     * Create new pharmacy inventory item
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const record = await PharmacyService.createPharmacyRecord(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: record,
                message: 'Medicine created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/pharmacy/:recordId
     * Update pharmacy inventory item
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const record = await PharmacyService.updatePharmacyRecord(req.params.clinicId, req.params.recordId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: record,
                message: 'Medicine updated successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/pharmacy/:recordId/stock
     * Update medicine stock and pricing
     */
    static updateStock = asyncHandler(async (req, res) => {
        const record = await PharmacyService.updateStock(req.params.clinicId, req.params.recordId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: record,
                message: 'Medicine stock updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/pharmacy/:recordId
     * Delete pharmacy inventory item
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await PharmacyService.deletePharmacyRecord(req.params.clinicId, req.params.recordId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });
}

module.exports = PharmacyController;
