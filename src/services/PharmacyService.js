const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');

class PharmacyService {
    /**
     * Get all pharmacy records for a clinic
     */
    static async getAllPharmacyRecords(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                clinicId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { medicineName: { contains: search, mode: 'insensitive' } },
                        { pet: { name: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            };

            const [records, total] = await Promise.all([
                prisma.pharmacyRecord.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        pet: true,
                        pharmacist: { select: { firstName: true, lastName: true, username: true } },
                    },
                    orderBy: { prescribedDate: 'desc' },
                }),
                prisma.pharmacyRecord.count({ where }),
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
            logger.error('Error in getAllPharmacyRecords:', error);
            throw new AppError('Failed to fetch pharmacy records', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get pharmacy record by ID
     */
    static async getPharmacyRecordById(clinicId, recordId) {
        try {
            const record = await prisma.pharmacyRecord.findUnique({
                where: { id: recordId },
                include: {
                    pet: true,
                    pharmacist: true,
                },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Pharmacy record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'PHARMACY_RECORD_NOT_FOUND'
                );
            }

            return record;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getPharmacyRecordById:', error);
            throw new AppError('Failed to fetch pharmacy record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create pharmacy record
     */
    static async createPharmacyRecord(clinicId, data) {
        try {
            const [pet, pharmacist] = await Promise.all([
                prisma.pet.findUnique({ where: { id: data.petId } }),
                prisma.user.findUnique({ where: { id: data.pharmacistId } }),
            ]);

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            if (!pharmacist || pharmacist.clinicId !== clinicId || !['PHARMACIST', 'VET', 'ADMIN'].includes(pharmacist.role)) {
                throw new AppError('Pharmacist not found', HTTP_STATUS.NOT_FOUND, 'PHARMACIST_NOT_FOUND');
            }

            const record = await prisma.pharmacyRecord.create({
                data: {
                    clinicId,
                    petId: data.petId,
                    pharmacistId: data.pharmacistId,
                    medicineName: data.medicineName,
                    dosage: data.dosage,
                    quantity: data.quantity,
                    duration: data.duration,
                    notes: data.notes,
                    cost: data.cost,
                    prescribedDate: data.prescribedDate || new Date(),
                },
            });

            logger.info(`Pharmacy record created: ${record.id}`);

            return record;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createPharmacyRecord:', error);
            throw new AppError('Failed to create pharmacy record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update pharmacy record
     */
    static async updatePharmacyRecord(clinicId, recordId, data) {
        try {
            const record = await prisma.pharmacyRecord.findUnique({
                where: { id: recordId },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Pharmacy record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'PHARMACY_RECORD_NOT_FOUND'
                );
            }

            const updatedRecord = await prisma.pharmacyRecord.update({
                where: { id: recordId },
                data: {
                    medicineName: data.medicineName || record.medicineName,
                    dosage: data.dosage || record.dosage,
                    quantity: data.quantity !== undefined ? data.quantity : record.quantity,
                    duration: data.duration || record.duration,
                    notes: data.notes || record.notes,
                    cost: data.cost !== undefined ? data.cost : record.cost,
                },
            });

            logger.info(`Pharmacy record updated: ${recordId}`);

            return updatedRecord;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updatePharmacyRecord:', error);
            throw new AppError('Failed to update pharmacy record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete pharmacy record
     */
    static async deletePharmacyRecord(clinicId, recordId) {
        try {
            const record = await prisma.pharmacyRecord.findUnique({
                where: { id: recordId },
            });

            if (!record || record.clinicId !== clinicId) {
                throw new AppError(
                    'Pharmacy record not found',
                    HTTP_STATUS.NOT_FOUND,
                    'PHARMACY_RECORD_NOT_FOUND'
                );
            }

            await prisma.pharmacyRecord.update({
                where: { id: recordId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Pharmacy record deleted: ${recordId}`);

            return { message: 'Pharmacy record deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deletePharmacyRecord:', error);
            throw new AppError('Failed to delete pharmacy record', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = PharmacyService;
