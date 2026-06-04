const { verifyAccessToken } = require('../utils/auth');
const { AppError, asyncHandler } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user data to request
 */
const authMiddleware = asyncHandler(async (req, res, next) => {
    try {
        // Get token from headers
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new AppError(
                'No authentication token provided',
                HTTP_STATUS.UNAUTHORIZED,
                'NO_TOKEN'
            );
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user data to request
        req.user = {
            id: decoded.id,
            clinicId: decoded.clinicId,
            clinicIds: decoded.clinicIds || (decoded.clinicId ? [decoded.clinicId] : []),
            role: decoded.role,
            email: decoded.email,
            username: decoded.username,
        };

        logger.debug(`User authenticated: ${decoded.username}`);
        next();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(
            'Invalid or expired token',
            HTTP_STATUS.UNAUTHORIZED,
            'INVALID_TOKEN'
        );
    }
});

module.exports = authMiddleware;
