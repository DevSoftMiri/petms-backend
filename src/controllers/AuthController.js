const { validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class AuthController {
    /**
     * POST /api/v1/auth/signup
     * Register new user
     */
    static signup = asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const user = await AuthService.signup(req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: user,
                message: 'User registered successfully',
            })
        );
    });

    /**
     * POST /api/v1/auth/login
     * Authenticate user and return tokens
     */
    static login = asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const { username, password } = req.body;
        const result = await AuthService.login(username, password);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: result,
                message: 'Login successful',
            })
        );
    });

    /**
     * POST /api/v1/auth/logout
     * Logout user
     */
    static logout = asyncHandler(async (req, res) => {
        await AuthService.logout(req.user.id, req.body.refreshToken);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: 'Logout successful',
            })
        );
    });

    /**
     * POST /api/v1/auth/refresh-token
     * Refresh access token
     */
    static refreshToken = asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const result = await AuthService.refreshAccessToken(req.user.id);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: result,
                message: 'Token refreshed successfully',
            })
        );
    });

    /**
     * PUT /api/v1/auth/change-password
     * Change user password
     */
    static changePassword = asyncHandler(async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const { currentPassword, password } = req.body;
        const result = await AuthService.changePassword(req.user.id, currentPassword, password);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });

    /**
     * GET /api/v1/auth/me
     * Get current user profile
     */
    static getProfile = asyncHandler(async (req, res) => {
        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: req.user,
                message: 'User profile retrieved successfully',
            })
        );
    });
}

module.exports = AuthController;
