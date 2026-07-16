const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');
const IdGenerator = require('../utils/idGenerator');

const splitContactName = (fullName = '') => {
    const cleaned = fullName.trim().replace(/\s+/g, ' ');

    if (!cleaned) {
        return { firstName: 'NGO', lastName: 'Contact' };
    }

    const parts = cleaned.split(' ');

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: 'Contact' };
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
};

const buildNgoMedicalNotes = (data = {}) => {
    const sections = [
        data.intakeType ? `Intake Type: ${data.intakeType}` : null,
        data.intakeDate ? `Intake Date: ${data.intakeDate}` : null,
        data.formNumber ? `Form Number: ${data.formNumber}` : null,
        data.rescueLocationCondition
            ? `Location / Condition: ${data.rescueLocationCondition}`
            : null,
        data.neutered ? `Neutered: ${data.neutered}` : null,
        data.vaccinationStatus
            ? `Vaccination Status: ${data.vaccinationStatus}`
            : null,
        data.medicalHistoryVetDetails
            ? `Medical History & Vet Details: ${data.medicalHistoryVetDetails}`
            : null,
    ].filter(Boolean);

    const combinedNotes = [
        sections.length ? sections.join('\n') : null,
        data.medicalNotes || null,
    ].filter(Boolean);

    return combinedNotes.length ? combinedNotes.join('\n\n') : null;
};

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
                        assignedVet: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        vetCases: {
                            where: { deletedAt: null },
                            select: {
                                id: true,
                                status: true,
                                caseDate: true,
                            },
                            orderBy: { caseDate: 'desc' },
                            take: 1,
                        },
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
            const petId = await IdGenerator.generatePetId();
            const enrichedMedicalNotes = buildNgoMedicalNotes(data);

            if (data.customerId) {
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
                        colour: data.colour || data.color,
                        medicalNotes: enrichedMedicalNotes,
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
            }

            const contactName = data.rescuerName || data.contactName || 'NGO Contact';
            const { firstName, lastName } = splitContactName(contactName);
            const generatedCustomerId = await IdGenerator.generateCustomerId();
            const generatedCustomerCode = IdGenerator.generateCustomerCode(contactName, data.rescuerPhone);

            const pet = await prisma.$transaction(async (tx) => {
                const contact = await tx.customer.create({
                    data: {
                        clinicId,
                        customerId: generatedCustomerId,
                        code: generatedCustomerCode,
                        firstName,
                        lastName,
                        email: data.rescuerEmail || null,
                        phoneNumber: data.rescuerPhone || null,
                        address: data.rescuerAddress || null,
                    },
                });

                return tx.pet.create({
                    data: {
                        clinicId,
                        customerId: contact.id,
                        petId,
                        name: data.name,
                        species: data.species,
                        breed: data.breed,
                        age: data.age,
                        gender: data.gender,
                        weight: data.weight,
                        colour: data.colour || data.color,
                        medicalNotes: enrichedMedicalNotes,
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
            });

            logger.info(`Pet created: ${pet.id} (${pet.petId}) with NGO contact ${generatedCustomerId}`);

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

    /**
     * Assign a pet to a veterinarian
     */
    static async assignVet(clinicId, petId, vetId) {
        try {
            logger.info(`[assignVet] Starting assignment - clinicId: ${clinicId}, petId: ${petId}, vetId: ${vetId}`);

            // Find the pet
            const pet = await prisma.pet.findFirst({
                where: {
                    OR: [
                        { id: petId },
                        { petId: petId },
                    ],
                },
            });

            logger.info(`[assignVet] Found pet:`, { id: pet?.id, status: pet?.status, assignedVetId: pet?.assignedVetId });

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            // Verify the vet exists and belongs to the same clinic
            const vet = await prisma.user.findFirst({
                where: {
                    id: vetId,
                    clinicId: clinicId,
                    role: 'VET',
                },
            });

            if (!vet) {
                throw new AppError('Veterinarian not found or does not belong to this clinic', HTTP_STATUS.NOT_FOUND, 'VET_NOT_FOUND');
            }

            logger.info(`[assignVet] Found vet: ${vet.firstName} ${vet.lastName} (${vet.id})`);

            // Assign the vet to the pet and reset status if DISCHARGED
            const updateData = {
                assignedVetId: vetId,
            };

            if (pet.status === 'DISCHARGED') {
                updateData.status = 'ACTIVE';
                updateData.dischargeDate = null;
                logger.info(`[assignVet] Resetting DISCHARGED pet to ACTIVE`);
            }

            const updatedPet = await prisma.pet.update({
                where: { id: pet.id },
                data: updateData,
                include: {
                    assignedVet: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    owner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            });

            logger.info(`[assignVet] Pet updated successfully:`, {
                petId: updatedPet.id,
                newStatus: updatedPet.status,
                assignedVetId: updatedPet.assignedVetId,
                assignedVetName: `${updatedPet.assignedVet?.firstName} ${updatedPet.assignedVet?.lastName}`
            });

            return updatedPet;
        } catch (error) {
            if (error instanceof AppError) {
                logger.error(`[assignVet] AppError:`, error.message);
                throw error;
            }
            logger.error(`[assignVet] Error:`, error);
            throw new AppError('Failed to assign veterinarian to pet', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = PetService;
