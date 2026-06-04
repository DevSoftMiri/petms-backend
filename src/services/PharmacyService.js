const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');

const MEDICINE_TYPES = ['Syrup', 'Ointment', 'Tablet', 'Injection', 'Drop'];

const toNumber = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toInteger = (value, fallback = 0) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toDate = (value) => (value ? new Date(value) : null);

const validateMedicine = (data) => {
    if (!data.productName || !data.productName.trim()) {
        throw new AppError('Product name is required', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    }

    if (!data.type || !MEDICINE_TYPES.includes(data.type)) {
        throw new AppError('Valid medicine type is required', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    }

    const stock = toInteger(data.stock);
    const mrp = toNumber(data.mrp);
    const payable = toNumber(data.payable);

    if (stock < 0) {
        throw new AppError('Stock cannot be negative', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    }

    if (payable > mrp) {
        throw new AppError('Payable amount cannot exceed MRP', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    }

    if (data.mfgDate && data.expDate && new Date(data.expDate) <= new Date(data.mfgDate)) {
        throw new AppError('Expiry date must be greater than manufacturing date', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    }
};

const mapMedicineData = (data) => ({
    productName: data.productName.trim(),
    dosage: data.dosage || null,
    power: data.power || null,
    type: data.type,
    weight: data.weight || null,
    mfgDate: toDate(data.mfgDate),
    expDate: toDate(data.expDate),
    mrp: toNumber(data.mrp),
    discount: toNumber(data.discount),
    vendor: data.vendor || null,
    payable: toNumber(data.payable),
    stock: toInteger(data.stock),
    inwardDate: toDate(data.inwardDate),
});

class PharmacyService {
    static async getAllPharmacyRecords(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;
            const searchQuery = search && search.trim();
            const where = {
                clinicId,
                deletedAt: null,
                ...(searchQuery && {
                    OR: [
                        { productName: { contains: searchQuery, mode: 'insensitive' } },
                        { dosage: { contains: searchQuery, mode: 'insensitive' } },
                        { type: { contains: searchQuery, mode: 'insensitive' } },
                        { vendor: { contains: searchQuery, mode: 'insensitive' } },
                    ],
                }),
            };

            const [records, total] = await Promise.all([
                prisma.pharmacyInventory.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.pharmacyInventory.count({ where }),
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
            throw new AppError('Failed to fetch pharmacy inventory', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async getPharmacyRecordById(clinicId, recordId) {
        try {
            const record = await prisma.pharmacyInventory.findFirst({
                where: { id: recordId, clinicId, deletedAt: null },
            });

            if (!record) {
                throw new AppError('Medicine not found', HTTP_STATUS.NOT_FOUND, 'MEDICINE_NOT_FOUND');
            }

            return record;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error in getPharmacyRecordById:', error);
            throw new AppError('Failed to fetch medicine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async createPharmacyRecord(clinicId, data) {
        try {
            validateMedicine(data);

            const record = await prisma.pharmacyInventory.create({
                data: {
                    clinicId,
                    ...mapMedicineData(data),
                },
            });

            logger.info(`Pharmacy inventory created: ${record.id}`);
            return record;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error in createPharmacyRecord:', error);
            throw new AppError('Failed to create medicine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async updatePharmacyRecord(clinicId, recordId, data) {
        try {
            const existing = await this.getPharmacyRecordById(clinicId, recordId);
            const merged = { ...existing, ...data };
            validateMedicine(merged);

            const record = await prisma.pharmacyInventory.update({
                where: { id: recordId },
                data: mapMedicineData(merged),
            });

            logger.info(`Pharmacy inventory updated: ${recordId}`);
            return record;
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error in updatePharmacyRecord:', error);
            throw new AppError('Failed to update medicine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async updateStock(clinicId, recordId, data) {
        try {
            const existing = await this.getPharmacyRecordById(clinicId, recordId);
            const merged = {
                ...existing,
                stock: data.stock,
                expDate: data.expDate !== undefined ? data.expDate : existing.expDate,
                mrp: data.mrp !== undefined ? data.mrp : existing.mrp,
                discount: data.discount !== undefined ? data.discount : existing.discount,
                payable: data.payable !== undefined ? data.payable : existing.payable,
            };
            validateMedicine(merged);

            return prisma.pharmacyInventory.update({
                where: { id: recordId },
                data: {
                    stock: toInteger(merged.stock),
                    expDate: toDate(merged.expDate),
                    mrp: toNumber(merged.mrp),
                    discount: toNumber(merged.discount),
                    payable: toNumber(merged.payable),
                },
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error in updateStock:', error);
            throw new AppError('Failed to update stock', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    static async deletePharmacyRecord(clinicId, recordId) {
        try {
            await this.getPharmacyRecordById(clinicId, recordId);

            await prisma.pharmacyInventory.update({
                where: { id: recordId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Pharmacy inventory deleted: ${recordId}`);
            return { message: 'Medicine deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) throw error;
            logger.error('Error in deletePharmacyRecord:', error);
            throw new AppError('Failed to delete medicine', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = PharmacyService;
