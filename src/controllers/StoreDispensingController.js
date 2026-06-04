const { validationResult } = require('express-validator');
const StoreDispensingService = require('../services/StoreDispensingService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class StoreDispensingController {
    /**
     * POST /api/v1/clinics/:clinicId/store/dispense
     * Create new store dispensing record
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const dispensing = await StoreDispensingService.createDispensing(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: dispensing,
                message: 'Store dispensing recorded successfully',
            })
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/store/dispense
     * Get all store dispensings for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        // Build filters from query params
        const filters = {};
        if (req.query.dispensingType) filters.dispensingType = req.query.dispensingType;
        if (req.query.storeItemId) filters.storeItemId = req.query.storeItemId;
        if (req.query.petId) filters.petId = req.query.petId;
        if (req.query.customerId) filters.customerId = req.query.customerId;
        if (req.query.search) filters.search = req.query.search;

        const result = await StoreDispensingService.getDispensingsByClinic(req.params.clinicId, page, limit, filters);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.dispensings,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Store dispensings retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/store/dispense/:dispensingId
     * Get store dispensing by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const dispensing = await StoreDispensingService.getDispensingById(req.params.clinicId, req.params.dispensingId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: dispensing,
                message: 'Store dispensing retrieved successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/store/dispense/:dispensingId
     * Update store dispensing record
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const dispensing = await StoreDispensingService.updateDispensing(req.params.clinicId, req.params.dispensingId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: dispensing,
                message: 'Store dispensing updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/store/dispense/:dispensingId
     * Delete store dispensing record (soft delete)
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await StoreDispensingService.deleteDispensing(req.params.clinicId, req.params.dispensingId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/store/dispense/summary
     * Get dispensing summary with sales and clinic use breakdown
     */
    static getSummary = asyncHandler(async (req, res) => {
        const filters = {};
        if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
        if (req.query.dateTo) filters.dateTo = req.query.dateTo;

        const summary = await StoreDispensingService.getDispensingsSummary(req.params.clinicId, filters);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: summary,
                message: 'Dispensing summary retrieved successfully',
            })
        );
    });
}

module.exports = StoreDispensingController;
