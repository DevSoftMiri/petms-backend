const { validationResult } = require('express-validator');
const PharmacyDeliveryService = require('../services/PharmacyDeliveryService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class PharmacyDeliveryController {
    /**
     * POST /api/v1/clinics/:clinicId/pharmacy/delivery
     * Create new pharmacy delivery record
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const delivery = await PharmacyDeliveryService.createDelivery(
            req.params.clinicId,
            { ...req.body, deliveredBy: req.user.id },
            req.user
        );

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: delivery,
                message: 'Pharmacy delivery recorded successfully',
            })
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pharmacy/delivery
     * Get all pharmacy deliveries for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        // Build filters from query params
        const filters = {};
        if (req.query.petId) filters.petId = req.query.petId;
        if (req.query.customerId) filters.customerId = req.query.customerId;
        if (req.query.prescriptionId) filters.prescriptionId = req.query.prescriptionId;
        if (req.query.search) filters.search = req.query.search;

        const result = await PharmacyDeliveryService.getDeliveriesByClinic(req.params.clinicId, page, limit, filters);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.deliveries,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Pharmacy deliveries retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
     * Get pharmacy delivery by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const delivery = await PharmacyDeliveryService.getDeliveryById(req.params.clinicId, req.params.deliveryId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: delivery,
                message: 'Pharmacy delivery retrieved successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
     * Update pharmacy delivery record
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const delivery = await PharmacyDeliveryService.updateDelivery(req.params.clinicId, req.params.deliveryId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: delivery,
                message: 'Pharmacy delivery updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/pharmacy/delivery/:deliveryId
     * Delete pharmacy delivery record (soft delete)
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await PharmacyDeliveryService.deleteDelivery(req.params.clinicId, req.params.deliveryId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pharmacy/delivery/pet/:petId
     * Get delivery history for a specific pet
     */
    static getDeliveryHistoryByPet = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const result = await PharmacyDeliveryService.getDeliveryHistoryByPet(req.params.clinicId, req.params.petId, page, limit);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.deliveries,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Pet delivery history retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/pharmacy/delivery/customer/:customerId
     * Get delivery history for a specific customer
     */
    static getDeliveryHistoryByCustomer = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);

        const result = await PharmacyDeliveryService.getDeliveryHistoryByCustomer(req.params.clinicId, req.params.customerId, page, limit);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.deliveries,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Customer delivery history retrieved successfully'
            )
        );
    });
}

module.exports = PharmacyDeliveryController;
