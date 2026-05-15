const prisma = require('../lib/prisma');
const { AppError, asyncHandler } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Permission-based Access Control Middleware
 * Checks if user has required permission(s)
 * 
 * Usage: permissionMiddleware('MANAGE_STAFF')(req, res, next)
 * Usage: permissionMiddleware(['MANAGE_STAFF', 'VIEW_USERS'])(req, res, next)
 */
const permissionMiddleware = (requiredPermissions) => {
    return asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new AppError(
                'User not authenticated',
                HTTP_STATUS.UNAUTHORIZED,
                'USER_NOT_AUTHENTICATED'
            );
        }

        // Convert single permission to array
        const permissions = Array.isArray(requiredPermissions)
            ? requiredPermissions
            : [requiredPermissions];

        // SUPERADMIN has all permissions
        if (req.user.role === 'SUPERADMIN') {
            logger.debug(`SUPERADMIN ${req.user.id} granted access (role bypass)`);
            return next();
        }

        // Get user permissions from database
        const userPermissions = await prisma.userPermission.findMany({
            where: { userId: req.user.id },
            include: { permission: true },
        });

        const userPermissionNames = userPermissions.map((up) => up.permission.name);

        // Check if user has at least one of the required permissions
        const hasPermission = permissions.some((perm) =>
            userPermissionNames.includes(perm)
        );

        if (!hasPermission) {
            logger.warn(
                `Unauthorized permission access attempt by user ${req.user.id}. Required: ${permissions.join(', ')}`
            );

            throw new AppError(
                `Access denied. Required permission(s): ${permissions.join(', ')}`,
                HTTP_STATUS.FORBIDDEN,
                'INSUFFICIENT_PERMISSION'
            );
        }

        logger.debug(`Permission check passed for user ${req.user.id}`);
        next();
    });
};

module.exports = permissionMiddleware;
