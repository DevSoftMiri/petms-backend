const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');
const IdGenerator = require('../utils/idGenerator');

class PetService {
    /**
     * Get all pets for a clinic with customer details
     */
    static async getAllPets(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                clinicId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { species: { contains: search, mode: 'insensitive' } },
                        { breed: { contains: search, mode: 'insensitive' } },
                        { gender: { contains: search, mode: 'insensitive' } },
                        { petId: { contains: search, mode: 'insensitive' } },
                        { owner: { firstName: { contains: search, mode: 'insensitive' } } },
                        { owner: { lastName: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            };

            const [pets, total] = await Promise.all([
                prisma.pet.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        owner: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                customerId: true,
                                code: true,
                                phoneNumber: true,
                                email: true,
                            },
                        },
                        clinic: { select: { id: true, clinicName: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.pet.count({ where }),
            ]);

            return {
                pets,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllPets:', error);
            throw new AppError('Failed to fetch pets', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get pet by ID - supports both Prisma id and custom petId
     */
    static async getPetById(clinicId, petId) {
        try {
            // Try to find by either internal id or custom petId
            const pet = await prisma.pet.findFirst({
                where: {
                    OR: [
                        { id: petId },
                        { petId: petId },
                    ],
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            customerId: true,
                            code: true,
                            phoneNumber: true,
                            email: true,
                        },
                    },
                    clinic: true,
                    appointments: { where: { deletedAt: null } },
                    groomingRecords: { where: { deletedAt: null } },
                    pharmacyRecords: { where: { deletedAt: null } },
                },
            });

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            return pet;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getPetById:', error);
            throw new AppError('Failed to fetch pet', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create pet with auto-generated petId
     */
    static async createPet(clinicId, data) {
        try {
            // Verify customer belongs to clinic (support both id and customerId)
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: data.customerId },
                        { customerId: data.customerId },
                    ],
                },
            });

            if (!customer || customer.clinicId !== clinicId) {
                throw new AppError(
                    'Customer not found',
                    HTTP_STATUS.NOT_FOUND,
                    'CUSTOMER_NOT_FOUND'
                );
            }

            // Generate petId
            const petId = await IdGenerator.generatePetId();

            const pet = await prisma.pet.create({
                data: {
                    clinicId,
                    customerId: customer.id,
                    petId,
                    name: data.name,
                    species: data.species,
                    breed: data.breed,
                    age: data.age,
                    gender: data.gender,
                    weight: data.weight,
                    colour: data.colour || data.color, // Support both colour and color
                    medicalNotes: data.medicalNotes,
                    microchipId: data.microchipId,
                    dateOfBirth: data.dateOfBirth,
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            customerId: true,
                            code: true,
                        },
                    },
                },
            });

            logger.info(`Pet created: ${pet.id} (${pet.petId}) for customer ${customer.customerId}`);

            return pet;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createPet:', error);
            throw new AppError('Failed to create pet', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update pet
     */
    static async updatePet(clinicId, petId, data) {
        try {
            // Support both id and petId
            const pet = await prisma.pet.findFirst({
                where: {
                    OR: [
                        { id: petId },
                        { petId: petId },
                    ],
                },
            });

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            const updatedPet = await prisma.pet.update({
                where: { id: pet.id },
                data: {
                    name: data.name !== undefined ? data.name : pet.name,
                    species: data.species !== undefined ? data.species : pet.species,
                    breed: data.breed !== undefined ? data.breed : pet.breed,
                    age: data.age !== undefined ? data.age : pet.age,
                    gender: data.gender !== undefined ? data.gender : pet.gender,
                    weight: data.weight !== undefined ? data.weight : pet.weight,
                    colour: (data.colour !== undefined || data.color !== undefined) ? (data.colour || data.color) : pet.colour,
                    medicalNotes: data.medicalNotes !== undefined ? data.medicalNotes : pet.medicalNotes,
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            customerId: true,
                            code: true,
                        },
                    },
                },
            });

            logger.info(`Pet updated: ${petId}`);

            return updatedPet;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updatePet:', error);
            throw new AppError('Failed to update pet', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete pet (soft delete)
     */
    static async deletePet(clinicId, petId) {
        try {
            // Support both id and petId
            const pet = await prisma.pet.findFirst({
                where: {
                    OR: [
                        { id: petId },
                        { petId: petId },
                    ],
                },
            });

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            await prisma.pet.update({
                where: { id: pet.id },
                data: { deletedAt: new Date() },
            });

            logger.info(`Pet deleted: ${petId}`);

            return { message: 'Pet deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deletePet:', error);
            throw new AppError('Failed to delete pet', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get pets by customer ID
     */
    static async getPetsByCustomer(clinicId, customerId) {
        try {
            // Support both id and customerId
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: customerId },
                        { customerId: customerId },
                    ],
                },
            });

            if (!customer || customer.clinicId !== clinicId) {
                throw new AppError('Customer not found', HTTP_STATUS.NOT_FOUND, 'CUSTOMER_NOT_FOUND');
            }

            const pets = await prisma.pet.findMany({
                where: {
                    customerId: customer.id,
                    deletedAt: null,
                },
                include: {
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            customerId: true,
                            code: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return pets;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getPetsByCustomer:', error);
            throw new AppError('Failed to fetch pets for customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = PetService;
