const { validationResult } = require('express-validator');
const UserService = require('../services/UserService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class UserController {
    /**
     * GET /api/v1/users
     * Get all users
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';
        const role = req.query.role || null;

        // SUPERADMIN can see all users, others can see only their clinic users
        const clinicId = req.user.role === 'SUPERADMIN' ? req.query.clinicId : req.user.clinicId;

        const result = await UserService.getAllUsers(clinicId, page, limit, search, role);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.users,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Users retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/users/:id
     * Get user by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const user = await UserService.getUserById(req.params.id);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: user,
                message: 'User retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/users
     * POST /api/v1/users
     * Create new user
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Format validation errors for frontend
            const formattedErrors = errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            }));

            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: formattedErrors,
            });
        }

        const clinicId = req.user.role === 'SUPERADMIN' ? req.body.clinicId : req.user.clinicId;
        if (req.user.role !== 'SUPERADMIN') {
            req.body.clinicId = req.user.clinicId;
            req.body.clinicIds = [req.user.clinicId];
        }
        const user = await UserService.createUser(clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: user,
                message: 'User created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/users/:id
     * Update user
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Format validation errors for frontend
            const formattedErrors = errors.array().map((err) => ({
                field: err.param,
                message: err.msg,
            }));

            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: formattedErrors,
            });
        }

        const updateData = { ...req.body };
        if (req.user.role !== 'SUPERADMIN') {
            delete updateData.clinicId;
            delete updateData.clinicIds;
        }

        const user = await UserService.updateUser(req.params.id, updateData);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: user,
                message: 'User updated successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/users/:id
     * Delete user
     */
    static delete = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const result = await UserService.deleteUser(req.params.id);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });

    /**
     * POST /api/v1/users/:userId/permissions
     * Assign permissions to user
     */
    static assignPermissions = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const result = await UserService.assignPermissionsToUser(req.params.userId, req.body.permissionIds);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });
}

module.exports = UserController;
