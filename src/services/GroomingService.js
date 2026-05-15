const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');

class GroomingService {
    /**
     * Get all grooming records for a clinic
     */
    static async getAllGroomingRecords(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                clinicId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { pet: { name: { contains: search, mode: 'insensitive' } } },
                        { groomer: { firstName: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            };

            const [records, total] = await Promise.all([
                prisma.groomingRecord.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        pet: true,
                        groomer: { select: { firstName: true, lastName: true, username: true } },
                    },
                    orderBy: { groomingDate: 'desc' },
                }),
                prisma.groomingRecord.count({ where }),
            ]);

            return {
                records,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllGroomingRecords:', error);
            throw new AppError('Failed to fetch grooming records', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get grooming record by ID
     */
    static async getGroomingRecordById(clinicId, recordId) {
        try {
            const record = await prisma.groomingRecord.findUnique({
                where: { id: recordId },
                include: {
                    pet: true,
                    groomer: true,
                },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Grooming record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'GROOMING_RECORD_NOT_FOUND'
                );
            }

            return record;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getGroomingRecordById:', error);
            throw new AppError('Failed to fetch grooming record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create grooming record
     */
    static async createGroomingRecord(clinicId, data) {
        try {
            const [pet, groomer] = await Promise.all([
                prisma.pet.findUnique({ where: { id: data.petId } }),
                prisma.user.findUnique({ where: { id: data.groomerId } }),
            ]);

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            if (!groomer || groomer.clinicId !== clinicId || !['GROOMER', 'ADMIN'].includes(groomer.role)) {
                throw new AppError('Groomer not found', HTTP_STATUS.NOT_FOUND, 'GROOMER_NOT_FOUND');
            }

            // Parse groomingDate to ensure valid ISO-8601 format
            const groomingDate = data.groomingDate
                ? new Date(data.groomingDate)
                : new Date();

            const record = await prisma.groomingRecord.create({
                data: {
                    clinicId,
                    petId: data.petId,
                    groomerId: data.groomerId,
                    services: JSON.stringify(data.services || []),
                    notes: data.notes,
                    cost: data.cost,
                    groomingDate,
                },
            });

            logger.info(`Grooming record created: ${record.id}`);

            return record;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createGroomingRecord:', error);
            throw new AppError('Failed to create grooming record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update grooming record
     */
    static async updateGroomingRecord(clinicId, recordId, data) {
        try {
            const record = await prisma.groomingRecord.findUnique({
                where: { id: recordId },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Grooming record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'GROOMING_RECORD_NOT_FOUND'
                );
            }

            const updatedRecord = await prisma.groomingRecord.update({
                where: { id: recordId },
                data: {
                    services: data.services ? JSON.stringify(data.services) : record.services,
                    notes: data.notes || record.notes,
                    cost: data.cost !== undefined ? data.cost : record.cost,
                    groomingDate: data.groomingDate ? new Date(data.groomingDate) : record.groomingDate,
                },
            });

            logger.info(`Grooming record updated: ${recordId}`);

            return updatedRecord;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updateGroomingRecord:', error);
            throw new AppError('Failed to update grooming record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete grooming record
     */
    static async deleteGroomingRecord(clinicId, recordId) {
        try {
            const record = await prisma.groomingRecord.findUnique({
                where: { id: recordId },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Grooming record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'GROOMING_RECORD_NOT_FOUND'
                );
            }

            await prisma.groomingRecord.update({
                where: { id: recordId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Grooming record deleted: ${recordId}`);

            return { message: 'Grooming record deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deleteGroomingRecord:', error);
            throw new AppError('Failed to delete grooming record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = GroomingService;
