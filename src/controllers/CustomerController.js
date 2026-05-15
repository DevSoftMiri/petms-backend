const { validationResult } = require('express-validator');
const CustomerService = require('../services/CustomerService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class CustomerController {
    /**
     * GET /api/v1/clinics/:clinicId/customers
     * Get all customers for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await CustomerService.getAllCustomers(req.params.clinicId, page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.customers,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Customers retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/customers/:customerId
     * Get customer by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const customer = await CustomerService.getCustomerById(req.params.clinicId, req.params.customerId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: customer,
                message: 'Customer retrieved successfully',
            })
        );
    });


    /**
     * POST /api/v1/clinics/:clinicId/customers
     * Create new customer
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const customer = await CustomerService.createCustomer(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: customer,
                message: 'Customer created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/customers/:customerId
     * Update customer
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const customer = await CustomerService.updateCustomer(req.params.clinicId, req.params.customerId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: customer,
                message: 'Customer updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/customers/:customerId
     * Delete customer
     */
    static delete = asyncHandler(async (req, res) => {
        const cascadeDeletePets = req.query.cascadeDeletePets !== 'false'; // Default: true
        const result = await CustomerService.deleteCustomer(req.params.clinicId, req.params.customerId, cascadeDeletePets);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: result,
                message: result.message,
            })
        );
    });
}

module.exports = CustomerController;
