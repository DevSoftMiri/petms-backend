const { AppError, asyncHandler } = require('../utils/errors');
const { HTTP_STATUS, USER_ROLES } = require('../utils/constants');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

/**
 * Clinic Access Control Middleware
 * Enforces multi-tenant isolation
 * 
 * Rules:
 * - SUPERADMIN: Can access any clinic
 * - ADMIN: Can only access own clinic
 * - STAFF: Can only access own clinic
 * 
 * Checks req.params.clinicId or req.body.clinicId
 */
const clinicAccessMiddleware = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new AppError(
            'User not authenticated',
            HTTP_STATUS.UNAUTHORIZED,
            'USER_NOT_AUTHENTICATED'
        );
    }

    // SUPERADMIN can access any clinic
    if (req.user.role === USER_ROLES.SUPERADMIN) {
        logger.debug(`SUPERADMIN ${req.user.id} granted clinic access (role bypass)`);
        return next();
    }

    // Get clinic ID from request
    const clinicId = req.params.clinicId || req.body.clinicId;

    if (!clinicId) {
        throw new AppError(
            'Clinic ID is required',
            HTTP_STATUS.BAD_REQUEST,
            'MISSING_CLINIC_ID'
        );
    }

    const membership = await prisma.userClinic.findUnique({
        where: {
            userId_clinicId: {
                userId: req.user.id,
                clinicId,
            },
        },
    });

    const legacyClinicUser = membership
        ? null
        : await prisma.user.findFirst({
            where: {
                id: req.user.id,
                clinicId,
            },
            select: { id: true, role: true },
        });

    // Check if user belongs to this clinic
    if (!membership && !legacyClinicUser) {
        logger.warn(
            `Cross-clinic access attempt by user ${req.user.id}. Requested clinic: ${clinicId}`
        );

        throw new AppError(
            'Access denied. You can only access assigned clinics',
            HTTP_STATUS.FORBIDDEN,
            'CROSS_CLINIC_ACCESS_DENIED'
        );
    }

    req.clinicRole = membership?.role || legacyClinicUser?.role || req.user.role;
    logger.debug(`Clinic access check passed for user ${req.user.id} to clinic ${clinicId}`);
    next();
});

module.exports = clinicAccessMiddleware;
