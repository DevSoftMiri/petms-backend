const { AppError, asyncHandler } = require('../utils/errors');
const { HTTP_STATUS, USER_ROLES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Role-based Access Control Middleware
 * Checks if user has required role(s)
 * 
 * Usage: roleMiddleware(['ADMIN', 'SUPERADMIN'])(req, res, next)
 */
const roleMiddleware = (requiredRoles = []) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                HTTP_STATUS.UNAUTHORIZED,
                'USER_NOT_AUTHENTICATED'
            );
        }

        const userRole = req.user.role;

        if (!requiredRoles.includes(userRole)) {
            logger.warn(
                `Unauthorized access attempt by user ${req.user.id} with role ${userRole}. Required roles: ${requiredRoles.join(', ')}`
            );

            throw new AppError(
                `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
                HTTP_STATUS.FORBIDDEN,
                'INSUFFICIENT_ROLE'
            );
        }

        logger.debug(`Role check passed for user ${req.user.id}`);
        next();
    });
};

module.exports = roleMiddleware;
