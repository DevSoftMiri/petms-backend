const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

class StoreDispensingService {
    /**
     * Record a store dispensing (item sold or used internally)
     */
    static async createDispensing(clinicId, dispensingData) {
        try {
            const { storeItemId, quantity, dispensingType, petId, customerId, dispensedBy, notes } = dispensingData;

            // Validate required fields
            if (!storeItemId || !quantity || !dispensingType || !dispensedBy) {
                throw new Error('storeItemId, quantity, dispensingType, and dispensedBy are required');
            }

            if (!['SALE', 'CLINIC_USE'].includes(dispensingType)) {
                throw new Error('dispensingType must be either "SALE" or "CLINIC_USE"');
            }

            // For sale type, customer is required
            if (dispensingType === 'SALE' && !customerId) {
                throw new Error('customerId is required for sale type');
            }

            // Verify clinic exists
            const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
            if (!clinic) {
                throw new Error('Clinic not found');
            }

            // Verify store item exists and belongs to clinic
            const storeItem = await prisma.storeItem.findFirst({
                where: { id: storeItemId, clinicId },
            });
            if (!storeItem) {
                throw new Error('Store item not found in this clinic');
            }

            // Check inventory availability
            if (storeItem.quantity < quantity) {
                throw new Error(`Insufficient inventory. Available: ${storeItem.quantity}, Requested: ${quantity}`);
            }

            // Verify staff member exists and belongs to clinic
            const staff = await prisma.user.findFirst({
                where: { id: dispensedBy },
            });
            if (!staff) {
                throw new Error('Staff member not found in this clinic');
            }

            // Verify customer if provided
            if (customerId) {
                const customer = await prisma.customer.findFirst({
                    where: { id: customerId, clinicId },
                });
                if (!customer) {
                    throw new Error('Customer not found in this clinic');
                }
            }

            // Verify pet if provided
            if (petId) {
                const pet = await prisma.pet.findFirst({
                    where: { id: petId, clinicId },
                });
                if (!pet) {
                    throw new Error('Pet not found in this clinic');
                }
            }

            // Deduct quantity from store inventory
            await prisma.storeItem.update({
                where: { id: storeItemId },
                data: { quantity: { decrement: quantity } },
            });

            // Create store dispensing record
            const dispensing = await prisma.storeDispensing.create({
                data: {
                    clinicId,
                    storeItemId,
                    quantity,
                    dispensingType,
                    petId: petId || null,
                    customerId: customerId || null,
                    dispensedBy,
                    notes: notes || null,
                },
                include: {
                    storeItem: { select: { id: true, name: true, price: true, category: true } },
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                    clinic: { select: { id: true, clinicName: true } },
                },
            });

            logger.info(`Store dispensing created: ${dispensing.id} in clinic ${clinicId}`);
            return dispensing;
        } catch (error) {
            logger.error(`Error creating store dispensing: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all store dispensings for a clinic
     */
    static async getDispensingsByClinic(clinicId, page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;

            // Build where conditions
            const whereCondition = {
                clinicId,
                deletedAt: null,
            };

            if (filters.dispensingType) {
                whereCondition.dispensingType = filters.dispensingType;
            }

            if (filters.storeItemId) {
                whereCondition.storeItemId = filters.storeItemId;
            }

            if (filters.petId) {
                whereCondition.petId = filters.petId;
            }

            if (filters.customerId) {
                whereCondition.customerId = filters.customerId;
            }

            if (filters.search) {
                whereCondition.OR = [
                    { storeItem: { name: { contains: filters.search, mode: 'insensitive' } } },
                    { pet: { name: { contains: filters.search, mode: 'insensitive' } } },
                    { customer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
                ];
            }

            // Get total count
            const total = await prisma.storeDispensing.count({ where: whereCondition });

            // Get paginated records
            const dispensings = await prisma.storeDispensing.findMany({
                where: whereCondition,
                include: {
                    storeItem: { select: { id: true, name: true, price: true, category: true } },
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { dispensingDate: 'desc' },
                skip,
                take: limit,
            });

            return {
                dispensings,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching store dispensings: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get store dispensing by ID
     */
    static async getDispensingById(clinicId, dispensingId) {
        try {
            const dispensing = await prisma.storeDispensing.findFirst({
                where: { id: dispensingId, clinicId },
                include: {
                    storeItem: { select: { id: true, name: true, price: true, category: true } },
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                    clinic: { select: { id: true, clinicName: true } },
                },
            });

            if (!dispensing) {
                throw new Error('Store dispensing not found');
            }

            return dispensing;
        } catch (error) {
            logger.error(`Error fetching store dispensing: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update store dispensing record
     */
    static async updateDispensing(clinicId, dispensingId, updateData) {
        try {
            // Verify dispensing exists
            const existingDispensing = await prisma.storeDispensing.findFirst({
                where: { id: dispensingId, clinicId },
            });

            if (!existingDispensing) {
                throw new Error('Store dispensing not found');
            }

            // If updating quantity, adjust store inventory
            if (updateData.quantity && updateData.quantity !== existingDispensing.quantity) {
                const quantityDiff = existingDispensing.quantity - updateData.quantity;
                await prisma.storeItem.update({
                    where: { id: existingDispensing.storeItemId },
                    data: { quantity: { increment: quantityDiff } },
                });
            }

            const updated = await prisma.storeDispensing.update({
                where: { id: dispensingId },
                data: updateData,
                include: {
                    storeItem: { select: { id: true, name: true, price: true, category: true } },
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });

            logger.info(`Store dispensing updated: ${dispensingId}`);
            return updated;
        } catch (error) {
            logger.error(`Error updating store dispensing: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete store dispensing record (soft delete)
     */
    static async deleteDispensing(clinicId, dispensingId) {
        try {
            // Verify dispensing exists
            const dispensing = await prisma.storeDispensing.findFirst({
                where: { id: dispensingId, clinicId },
            });

            if (!dispensing) {
                throw new Error('Store dispensing not found');
            }

            // Reverse the inventory decrement
            await prisma.storeItem.update({
                where: { id: dispensing.storeItemId },
                data: { quantity: { increment: dispensing.quantity } },
            });

            await prisma.storeDispensing.update({
                where: { id: dispensingId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Store dispensing deleted: ${dispensingId}`);
            return { message: 'Store dispensing deleted successfully' };
        } catch (error) {
            logger.error(`Error deleting store dispensing: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get dispensing summary by type
     */
    static async getDispensingsSummary(clinicId, filters = {}) {
        try {
            const whereCondition = {
                clinicId,
                deletedAt: null,
            };

            if (filters.dateFrom || filters.dateTo) {
                whereCondition.dispensingDate = {};
                if (filters.dateFrom) {
                    whereCondition.dispensingDate.gte = new Date(filters.dateFrom);
                }
                if (filters.dateTo) {
                    whereCondition.dispensingDate.lte = new Date(filters.dateTo);
                }
            }

            const sales = await prisma.storeDispensing.findMany({
                where: { ...whereCondition, dispensingType: 'sale' },
                include: { storeItem: { select: { price: true } } },
            });

            const clinicUse = await prisma.storeDispensing.findMany({
                where: { ...whereCondition, dispensingType: 'clinic_use' },
            });

            const totalSalesAmount = sales.reduce((sum, item) => {
                return sum + (item.quantity * (item.storeItem.price || 0));
            }, 0);

            return {
                sales: {
                    count: sales.length,
                    items: sales,
                    totalAmount: totalSalesAmount,
                },
                clinicUse: {
                    count: clinicUse.length,
                    items: clinicUse,
                },
            };
        } catch (error) {
            logger.error(`Error fetching dispensing summary: ${error.message}`);
            throw error;
        }
    }
}

module.exports = StoreDispensingService;
