const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');

class ClinicService {
    /**
     * Get all clinics (SUPERADMIN only)
     */
    static async getAllClinics(page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                deletedAt: null, // Only include non-deleted clinics
                ...(search && {
                    OR: [
                        { clinicName: { contains: search, mode: 'insensitive' } },
                        { clinicCode: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            };

            const [clinics, total] = await Promise.all([
                prisma.clinic.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.clinic.count({ where }),
            ]);

            return {
                clinics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllClinics:', error);
            throw new AppError('Failed to fetch clinics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get clinic by ID
     */
    static async getClinicById(clinicId) {
        try {
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                include: {
                    users: {
                        where: { deletedAt: null }, // Only active users
                        select: { id: true, username: true, role: true, isActive: true }
                    },
                    _count: {
                        select: {
                            pets: { where: { deletedAt: null } },
                            customers: { where: { deletedAt: null } },
                            appointments: { where: { deletedAt: null } },
                        },
                    },
                },
            });

            if (!clinic || clinic.deletedAt) {
                throw new AppError('Clinic not found', HTTP_STATUS.NOT_FOUND, 'CLINIC_NOT_FOUND');
            }

            return clinic;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getClinicById:', error);
            throw new AppError('Failed to fetch clinic', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create clinic (SUPERADMIN only)
     */
    static async createClinic(data) {
        try {
            // Check if clinic code is unique
            const existingClinic = await prisma.clinic.findUnique({
                where: { clinicCode: data.clinicCode },
            });

            if (existingClinic) {
                throw new AppError(
                    'Clinic code already exists',
                    HTTP_STATUS.CONFLICT,
                    'CLINIC_CODE_EXISTS'
                );
            }

            const clinic = await prisma.clinic.create({
                data: {
                    clinicName: data.clinicName,
                    clinicCode: data.clinicCode,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    licenseNumber: data.licenseNumber,
                    subscriptionPlan: data.subscriptionPlan || 'STARTER',
                    maxUsers: data.maxUsers || 10,
                },
            });

            logger.info(`Clinic created: ${clinic.clinicCode}`);

            return clinic;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createClinic:', error);
            throw new AppError('Failed to create clinic', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update clinic
     */
    static async updateClinic(clinicId, data) {
        try {
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
            });

            if (!clinic) {
                throw new AppError('Clinic not found', HTTP_STATUS.NOT_FOUND, 'CLINIC_NOT_FOUND');
            }

            const updatedClinic = await prisma.clinic.update({
                where: { id: clinicId },
                data: {
                    clinicName: data.clinicName || clinic.clinicName,
                    email: data.email || clinic.email,
                    phoneNumber: data.phoneNumber || clinic.phoneNumber,
                    address: data.address || clinic.address,
                    city: data.city || clinic.city,
                    state: data.state || clinic.state,
                    zipCode: data.zipCode || clinic.zipCode,
                    country: data.country || clinic.country,
                    subscriptionPlan: data.subscriptionPlan || clinic.subscriptionPlan,
                    maxUsers: data.maxUsers || clinic.maxUsers,
                    isActive: data.isActive !== undefined ? data.isActive : clinic.isActive,
                },
            });

            logger.info(`Clinic updated: ${clinicId}`);

            return updatedClinic;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updateClinic:', error);
            throw new AppError('Failed to update clinic', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete clinic (with cascade soft delete of related records)
     */
    static async deleteClinic(clinicId) {
        try {
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
            });

            if (!clinic) {
                throw new AppError('Clinic not found', HTTP_STATUS.NOT_FOUND, 'CLINIC_NOT_FOUND');
            }

            // Use transaction to soft delete clinic and all related records
            await prisma.$transaction(async (tx) => {
                const deletionDate = new Date();

                // Soft delete all related records first (cascade)
                await tx.user.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                await tx.pet.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                await tx.customer.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                await tx.appointment.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                await tx.groomingRecord.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                await tx.pharmacyRecord.updateMany({
                    where: { clinicId: clinicId },
                    data: { deletedAt: deletionDate },
                });

                // Finally, soft delete the clinic
                await tx.clinic.update({
                    where: { id: clinicId },
                    data: { deletedAt: deletionDate },
                });
            });

            logger.info(`Clinic and related records deleted: ${clinicId}`);

            return { message: 'Clinic deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deleteClinic:', error);
            throw new AppError('Failed to delete clinic. Please try again or contact support.', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = ClinicService;
