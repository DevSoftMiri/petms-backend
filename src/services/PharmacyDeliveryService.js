const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

class PharmacyDeliveryService {
    /**
     * Record a pharmacy delivery (medicine given to customer/pet)
     */
    static async createDelivery(clinicId, deliveryData, actor = null) {
        try {
            const { prescriptionId, supplyId, pharmacyInventoryId, medicineName, dosage, petId, customerId, deliveredBy, notes } = deliveryData;
            const quantity = parseInt(deliveryData.quantity, 10);

            // Validate required fields
            if (!medicineName || !quantity || quantity <= 0 || !deliveredBy) {
                throw new Error('medicineName, quantity, and deliveredBy are required');
            }

            // Validate at least one recipient (pet or customer)
            if (!petId && !customerId) {
                throw new Error('Either petId or customerId must be provided');
            }

            // Verify clinic exists
            const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
            if (!clinic) {
                throw new Error('Clinic not found');
            }

            const staffWhere = actor?.role === 'SUPERADMIN'
                ? { id: actor.id, role: 'SUPERADMIN', isActive: true }
                : {
                    id: deliveredBy,
                    isActive: true,
                    OR: [
                        { clinicId },
                        { clinicMemberships: { some: { clinicId } } },
                    ],
                };

            const staff = await prisma.user.findFirst({ where: staffWhere });
            if (!staff) {
                throw new Error('Staff member not found in this clinic');
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

            // Verify customer if provided
            if (customerId) {
                const customer = await prisma.customer.findFirst({
                    where: { id: customerId, clinicId },
                });
                if (!customer) {
                    throw new Error('Customer not found in this clinic');
                }
            }

            // Verify prescription if provided
            if (prescriptionId) {
                const prescription = await prisma.prescription.findUnique({
                    where: { id: prescriptionId },
                });
                if (!prescription) {
                    throw new Error('Prescription not found');
                }
            }

            // Verify supply if provided
            if (supplyId) {
                const supply = await prisma.supply.findFirst({
                    where: { id: supplyId, clinicId },
                });
                if (!supply) {
                    throw new Error('Supply not found in this clinic');
                }

                // Deduct quantity from supply inventory
                await prisma.supply.update({
                    where: { id: supplyId },
                    data: { quantity: { decrement: quantity } },
                });
            }

            if (pharmacyInventoryId) {
                const medicine = await prisma.pharmacyInventory.findFirst({
                    where: { id: pharmacyInventoryId, clinicId, deletedAt: null },
                });

                if (!medicine) {
                    throw new Error('Medicine stock item not found in this clinic');
                }

                if ((medicine.stock || 0) < quantity) {
                    throw new Error(`Insufficient stock. Available: ${medicine.stock || 0}`);
                }

                await prisma.pharmacyInventory.update({
                    where: { id: pharmacyInventoryId },
                    data: { stock: { decrement: quantity } },
                });
            }

            // Create pharmacy delivery record
            const delivery = await prisma.pharmacyDelivery.create({
                data: {
                    clinicId,
                    prescriptionId: prescriptionId || null,
                    supplyId: supplyId || null,
                    pharmacyInventoryId: pharmacyInventoryId || null,
                    medicineName,
                    quantity,
                    dosage: dosage || null,
                    petId: petId || null,
                    customerId: customerId || null,
                    deliveredBy,
                    notes: notes || null,
                },
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                    clinic: { select: { id: true, clinicName: true } },
                },
            });

            logger.info(`Pharmacy delivery created: ${delivery.id} in clinic ${clinicId}`);
            return delivery;
        } catch (error) {
            logger.error(`Error creating pharmacy delivery: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all pharmacy deliveries for a clinic
     */
    static async getDeliveriesByClinic(clinicId, page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;

            // Build where conditions
            const whereCondition = {
                clinicId,
                deletedAt: null,
            };

            if (filters.petId) {
                whereCondition.petId = filters.petId;
            }

            if (filters.customerId) {
                whereCondition.customerId = filters.customerId;
            }

            if (filters.prescriptionId) {
                whereCondition.prescriptionId = filters.prescriptionId;
            }

            if (filters.search) {
                whereCondition.OR = [
                    { medicineName: { contains: filters.search, mode: 'insensitive' } },
                    { pet: { name: { contains: filters.search, mode: 'insensitive' } } },
                    { customer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
                ];
            }

            // Get total count
            const total = await prisma.pharmacyDelivery.count({ where: whereCondition });

            // Get paginated records
            const deliveries = await prisma.pharmacyDelivery.findMany({
                where: whereCondition,
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                orderBy: { deliveryDate: 'desc' },
                skip,
                take: limit,
            });

            return {
                deliveries,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching pharmacy deliveries: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get pharmacy delivery by ID
     */
    static async getDeliveryById(clinicId, deliveryId) {
        try {
            const delivery = await prisma.pharmacyDelivery.findFirst({
                where: { id: deliveryId, clinicId },
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                    clinic: { select: { id: true, clinicName: true } },
                },
            });

            if (!delivery) {
                throw new Error('Pharmacy delivery not found');
            }

            return delivery;
        } catch (error) {
            logger.error(`Error fetching pharmacy delivery: ${error.message}`);
            throw error;
        }
    }

    /**
     * Update pharmacy delivery record
     */
    static async updateDelivery(clinicId, deliveryId, updateData) {
        try {
            // Verify delivery exists
            const existingDelivery = await prisma.pharmacyDelivery.findFirst({
                where: { id: deliveryId, clinicId },
            });

            if (!existingDelivery) {
                throw new Error('Pharmacy delivery not found');
            }

            // If updating quantity and supply is linked, adjust supply inventory
            const updatedQuantity = updateData.quantity !== undefined ? parseInt(updateData.quantity, 10) : null;

            if (updatedQuantity && updatedQuantity !== existingDelivery.quantity && existingDelivery.supplyId) {
                const quantityDiff = updatedQuantity - existingDelivery.quantity;
                await prisma.supply.update({
                    where: { id: existingDelivery.supplyId },
                    data: { quantity: { decrement: quantityDiff } },
                });
            }

            if (updatedQuantity && updatedQuantity !== existingDelivery.quantity && existingDelivery.pharmacyInventoryId) {
                const quantityDiff = updatedQuantity - existingDelivery.quantity;
                const stockItem = await prisma.pharmacyInventory.findFirst({
                    where: { id: existingDelivery.pharmacyInventoryId, clinicId, deletedAt: null },
                });

                if (!stockItem) {
                    throw new Error('Medicine stock item not found in this clinic');
                }

                if (quantityDiff > 0 && (stockItem.stock || 0) < quantityDiff) {
                    throw new Error(`Insufficient stock. Available: ${stockItem.stock || 0}`);
                }

                await prisma.pharmacyInventory.update({
                    where: { id: existingDelivery.pharmacyInventoryId },
                    data: { stock: { decrement: quantityDiff } },
                });
            }

            const updated = await prisma.pharmacyDelivery.update({
                where: { id: deliveryId },
                data: {
                    ...updateData,
                    ...(updatedQuantity ? { quantity: updatedQuantity } : {}),
                },
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    pet: { select: { id: true, name: true, petId: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, customerId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });

            logger.info(`Pharmacy delivery updated: ${deliveryId}`);
            return updated;
        } catch (error) {
            logger.error(`Error updating pharmacy delivery: ${error.message}`);
            throw error;
        }
    }

    /**
     * Delete pharmacy delivery record (soft delete)
     */
    static async deleteDelivery(clinicId, deliveryId) {
        try {
            // Verify delivery exists
            const delivery = await prisma.pharmacyDelivery.findFirst({
                where: { id: deliveryId, clinicId },
            });

            if (!delivery) {
                throw new Error('Pharmacy delivery not found');
            }

            // If supply was linked, reverse the inventory decrement
            if (delivery.supplyId) {
                await prisma.supply.update({
                    where: { id: delivery.supplyId },
                    data: { quantity: { increment: delivery.quantity } },
                });
            }

            if (delivery.pharmacyInventoryId) {
                await prisma.pharmacyInventory.update({
                    where: { id: delivery.pharmacyInventoryId },
                    data: { stock: { increment: delivery.quantity } },
                });
            }

            await prisma.pharmacyDelivery.update({
                where: { id: deliveryId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Pharmacy delivery deleted: ${deliveryId}`);
            return { message: 'Pharmacy delivery deleted successfully' };
        } catch (error) {
            logger.error(`Error deleting pharmacy delivery: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get delivery history for a pet
     */
    static async getDeliveryHistoryByPet(clinicId, petId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            const total = await prisma.pharmacyDelivery.count({
                where: { clinicId, petId, deletedAt: null },
            });

            const deliveries = await prisma.pharmacyDelivery.findMany({
                where: { clinicId, petId, deletedAt: null },
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    staff: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { deliveryDate: 'desc' },
                skip,
                take: limit,
            });

            return {
                deliveries,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            logger.error(`Error fetching pet delivery history: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get delivery history for a customer
     */
    static async getDeliveryHistoryByCustomer(clinicId, customerId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            const total = await prisma.pharmacyDelivery.count({
                where: { clinicId, customerId, deletedAt: null },
            });

            const deliveries = await prisma.pharmacyDelivery.findMany({
                where: { clinicId, customerId, deletedAt: null },
                include: {
                    prescription: true,
                    supply: true,
                    pharmacyInventory: true,
                    pet: { select: { id: true, name: true, petId: true } },
                    staff: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: { deliveryDate: 'desc' },
                skip,
                take: limit,
            });

            return {
                deliveries,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            };
        } catch (error) {
            logger.error(`Error fetching customer delivery history: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PharmacyDeliveryService;
