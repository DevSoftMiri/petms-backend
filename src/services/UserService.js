const prisma = require('../lib/prisma');
const { hashPassword } = require('../utils/auth');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION, ROLE_PERMISSIONS, ROLE_ALLOWED_PAGES, AVAILABLE_PAGE_ACCESS } = require('../utils/constants');
const logger = require('../utils/logger');

class UserService {
    static mapUserClinics(user) {
        const memberships = user.clinicMemberships || [];
        const clinics = memberships.map((membership) => ({
            id: membership.clinic.id,
            clinicName: membership.clinic.clinicName,
            clinicCode: membership.clinic.clinicCode,
            role: membership.role,
            isDefault: membership.isDefault,
        }));

        return {
            ...user,
            clinics,
            clinicIds: clinics.map((clinic) => clinic.id),
        };
    }

    static normalizeClinicIds(data, fallbackClinicId = null) {
        const ids = Array.isArray(data.clinicIds)
            ? data.clinicIds
            : (data.clinicId ? [data.clinicId] : []);

        if (fallbackClinicId && ids.length === 0) {
            ids.push(fallbackClinicId);
        }

        return [...new Set(ids.filter(Boolean))];
    }

    static normalizeAllowedPages(allowedPages, role = 'STAFF') {
        if (!Array.isArray(allowedPages)) {
            return ROLE_ALLOWED_PAGES[role] || ROLE_ALLOWED_PAGES.STAFF || [];
        }

        return [...new Set(allowedPages.filter((page) => AVAILABLE_PAGE_ACCESS.includes(page)))];
    }

    /**
     * Get all users (with filtering)
     */
    static async getAllUsers(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '', role = null) {
        try {
            const skip = (page - 1) * limit;

            const filters = [];
            if (clinicId) {
                filters.push({
                    OR: [
                        { clinicId },
                        { clinicMemberships: { some: { clinicId } } },
                    ],
                });
            }
            if (search) {
                filters.push({
                    OR: [
                        { username: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                    ],
                });
            }

            const where = {
                ...(role && { role }),
                ...(filters.length > 0 && { AND: filters }),
            };

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        allowedPages: true,
                        isActive: true,
                        lastLogin: true,
                        createdAt: true,
                        clinicId: true,
                        phoneNumber: true,
                        clinicMemberships: {
                            include: {
                                clinic: {
                                    select: {
                                        id: true,
                                        clinicName: true,
                                        clinicCode: true,
                                    },
                                },
                            },
                            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
            ]);

            return {
                users: users.map((user) => UserService.mapUserClinics(user)),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllUsers:', error);
            throw new AppError('Failed to fetch users', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    role: true,
                    allowedPages: true,
                    isActive: true,
                    clinicId: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                    permissions: {
                        include: { permission: true },
                    },
                    clinicMemberships: {
                        include: {
                            clinic: {
                                select: {
                                    id: true,
                                    clinicName: true,
                                    clinicCode: true,
                                },
                            },
                        },
                        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                    },
                },
            });

            if (!user) {
                throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
            }

            return {
                ...UserService.mapUserClinics(user),
                permissions: user.permissions.map((up) => up.permission.name),
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getUserById:', error);
            throw new AppError('Failed to fetch user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create user
     */
    static async createUser(clinicId, data) {
        try {
            const clinicIds = UserService.normalizeClinicIds(data, clinicId);
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [{ email: data.email }, { username: data.username }],
                },
            });

            if (existingUser) {
                throw new AppError(
                    'User with this email or username already exists',
                    HTTP_STATUS.CONFLICT,
                    'USER_EXISTS'
                );
            }

            // Hash password
            const hashedPassword = await hashPassword(data.password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    clinicId: clinicIds[0] || null,
                    username: data.username,
                    email: data.email,
                    password: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phoneNumber: data.phoneNumber,
                    role: data.role || 'STAFF',
                    allowedPages: UserService.normalizeAllowedPages(data.allowedPages, data.role || 'STAFF'),
                    ...(clinicIds.length > 0 && {
                        clinicMemberships: {
                            create: clinicIds.map((id, index) => ({
                                clinicId: id,
                                role: data.role || 'STAFF',
                                isDefault: index === 0,
                            })),
                        },
                    }),
                },
            });

            // Assign default permissions for the role
            const permissions = ROLE_PERMISSIONS[user.role] || [];
            if (permissions.length > 0) {
                const permissionRecords = await prisma.permission.findMany({
                    where: { name: { in: permissions } },
                });

                await prisma.userPermission.createMany({
                    data: permissionRecords.map((perm) => ({
                        userId: user.id,
                        permissionId: perm.id,
                    })),
                });
            }

            logger.info(`User created: ${user.username}`);

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                allowedPages: user.allowedPages,
                clinicId: user.clinicId,
                clinicIds,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createUser:', error);
            throw new AppError('Failed to create user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update user
     */
    static async updateUser(userId, data) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    clinicMemberships: {
                        select: {
                            clinicId: true,
                            isDefault: true,
                        },
                        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
                    },
                },
            });

            if (!user) {
                throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    firstName: data.firstName || user.firstName,
                    lastName: data.lastName || user.lastName,
                    email: data.email || user.email,
                    phoneNumber: data.phoneNumber || user.phoneNumber,
                    role: data.role || user.role,
                    ...(data.allowedPages !== undefined
                        ? { allowedPages: UserService.normalizeAllowedPages(data.allowedPages, data.role || user.role) }
                        : {}),
                    isActive: data.isActive !== undefined ? data.isActive : user.isActive,
                    ...(data.clinicId !== undefined || data.clinicIds !== undefined
                        ? { clinicId: UserService.normalizeClinicIds(data)[0] || null }
                        : {}),
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    allowedPages: true,
                    isActive: true,
                    clinicId: true,
                },
            });

            const membershipChanged = data.clinicId !== undefined || data.clinicIds !== undefined;

            if (membershipChanged) {
                const clinicIds = UserService.normalizeClinicIds(data, updatedUser.clinicId);
                await prisma.$transaction(async (tx) => {
                    await tx.userClinic.deleteMany({ where: { userId } });
                    if (clinicIds.length > 0) {
                        await tx.userClinic.createMany({
                            data: clinicIds.map((id, index) => ({
                                userId,
                                clinicId: id,
                                role: updatedUser.role,
                                isDefault: index === 0,
                            })),
                            skipDuplicates: true,
                        });
                    }
                });
            } else if (data.role && user.clinicMemberships.length > 0) {
                await prisma.userClinic.updateMany({
                    where: { userId },
                    data: { role: updatedUser.role },
                });
            }

            logger.info(`User updated: ${userId}`);

            return UserService.getUserById(updatedUser.id);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updateUser:', error);
            throw new AppError('Failed to update user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
            }

            await prisma.user.delete({
                where: { id: userId },
                
            });

            logger.info(`User deleted: ${userId}`);

            return { message: 'User deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deleteUser:', error);
            throw new AppError('Failed to delete user', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Assign permissions to user
     */
    static async assignPermissionsToUser(userId, permissionIds) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AppError('User not found', HTTP_STATUS.NOT_FOUND, 'USER_NOT_FOUND');
            }

            // Delete existing permissions
            await prisma.userPermission.deleteMany({
                where: { userId },
            });

            // Create new permissions
            const permissions = await prisma.permission.findMany({
                where: { id: { in: permissionIds } },
            });

            await prisma.userPermission.createMany({
                data: permissions.map((perm) => ({
                    userId,
                    permissionId: perm.id,
                })),
            });

            logger.info(`Permissions assigned to user: ${userId}`);

            return { message: 'Permissions assigned successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in assignPermissionsToUser:', error);
            throw new AppError('Failed to assign permissions', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = UserService;
