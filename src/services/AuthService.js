const prisma = require('../lib/prisma');
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } = require('../utils/auth');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, ROLE_PERMISSIONS } = require('../utils/constants');
const logger = require('../utils/logger');

class AuthService {
    /**
     * Signup - Create new user account
     */
    static async signup(userData) {
        const { username, email, password, firstName, lastName, clinicId, role = 'STAFF', phoneNumber } = userData;

        try {
            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { username },
                    ],
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
            const hashedPassword = await hashPassword(password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    phoneNumber,
                    role,
                    clinicId: clinicId || null,
                },
            });

            // Assign default permissions for the role
            const permissions = ROLE_PERMISSIONS[role] || [];
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

            logger.info(`User created successfully: ${username}`);

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                clinicId: user.clinicId,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in signup:', error);
            throw new AppError('Failed to create user account', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Login - Authenticate user and generate tokens
     */
    static async login(username, password) {
        try {
            // Find user by username or email
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username },
                        { email: username },
                    ],
                    isActive: true,
                },
            });

            if (!user) {
                throw new AppError(
                    'Invalid username or password',
                    HTTP_STATUS.UNAUTHORIZED,
                    'INVALID_CREDENTIALS'
                );
            }

            // Verify password
            const isPasswordValid = await comparePassword(password, user.password);

            if (!isPasswordValid) {
                throw new AppError(
                    'Invalid username or password',
                    HTTP_STATUS.UNAUTHORIZED,
                    'INVALID_CREDENTIALS'
                );
            }

            // Generate tokens
            const payload = {
                id: user.id,
                username: user.username,
                email: user.email,
                clinicId: user.clinicId,
                role: user.role,
            };

            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            // Update last login and store refresh token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: new Date(),
                    refreshTokens: {
                        push: refreshToken,
                    },
                },
            });

            logger.info(`User logged in: ${username}`);

            return {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    clinicId: user.clinicId,
                },
                accessToken,
                refreshToken,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in login:', error);
            throw new AppError('Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Logout - Remove refresh token
     */
    static async logout(userId, refreshToken) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    refreshTokens: {
                        set: [], // Clear all refresh tokens
                    },
                },
            });

            logger.info(`User logged out: ${userId}`);
        } catch (error) {
            logger.error('Error in logout:', error);
            throw new AppError('Logout failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Refresh access token
     */
    static async refreshAccessToken(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AppError(
                    'User not found',
                    HTTP_STATUS.NOT_FOUND,
                    'USER_NOT_FOUND'
                );
            }

            const payload = {
                id: user.id,
                username: user.username,
                email: user.email,
                clinicId: user.clinicId,
                role: user.role,
            };

            const accessToken = generateAccessToken(payload);

            return { accessToken };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in refreshAccessToken:', error);
            throw new AppError('Failed to refresh token', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Change password
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new AppError(
                    'User not found',
                    HTTP_STATUS.NOT_FOUND,
                    'USER_NOT_FOUND'
                );
            }

            // Verify current password
            const isPasswordValid = await comparePassword(currentPassword, user.password);

            if (!isPasswordValid) {
                throw new AppError(
                    'Current password is incorrect',
                    HTTP_STATUS.UNAUTHORIZED,
                    'INVALID_CURRENT_PASSWORD'
                );
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });

            logger.info(`Password changed for user: ${userId}`);

            return { message: 'Password changed successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in changePassword:', error);
            throw new AppError('Failed to change password', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = AuthService;
