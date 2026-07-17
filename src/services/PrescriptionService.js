const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

class PrescriptionService {
    /**
     * Get all prescriptions for a clinic with optional filtering
     */
    static async getPrescriptionsByClinic(clinicId, page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;

            // Build where conditions
            const whereCondition = {
                caseDiagnosis: {
                    vetCase: {
                        clinicId,
                    },
                },
                deletedAt: null,
            };

            if (filters.petId) {
                whereCondition.caseDiagnosis = {
                    vetCase: {
                        clinicId,
                        petId: filters.petId,
                    },
                };
            }

            if (filters.search) {
                whereCondition.OR = [
                    { medicineName: { contains: filters.search, mode: 'insensitive' } },
                    { caseDiagnosis: { diagnosis: { contains: filters.search, mode: 'insensitive' } } },
                ];
            }

            // Get total count
            const total = await prisma.prescription.count({ where: whereCondition });

            // Get paginated records
            const prescriptions = await prisma.prescription.findMany({
                where: whereCondition,
                include: {
                    caseDiagnosis: {
                        include: {
                            vetCase: {
                                include: {
                                    pet: {
                                        select: {
                                            id: true,
                                            petId: true,
                                            name: true,
                                            species: true,
                                            breed: true,
                                            owner: {
                                                select: { id: true, firstName: true, lastName: true, customerId: true },
                                            },
                                        },
                                    },
                                    vet: {
                                        select: { id: true, firstName: true, lastName: true, email: true, role: true },
                                    },
                                    clinic: { select: { id: true, clinicName: true } },
                                },
                            },
                        },
                    },
                    pharmacyDeliveries: {
                        include: {
                            staff: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                },
                orderBy: { prescribedAt: 'desc' },
                skip,
                take: limit,
            });

            // Transform the data to include pet and clinic info at top level for easier access
            const transformedPrescriptions = prescriptions.map((p) => ({
                ...p,
                pet: p.caseDiagnosis.vetCase.pet,
                vet: p.caseDiagnosis.vetCase.vet,
                clinic: p.caseDiagnosis.vetCase.clinic,
                diagnosis: p.caseDiagnosis.diagnosis,
                diagnosisNotes: p.caseDiagnosis.notes,
            }));

            return {
                prescriptions: transformedPrescriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching prescriptions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get prescription by ID
     */
    static async getPrescriptionById(prescriptionId, clinicId) {
        try {
            const prescription = await prisma.prescription.findFirst({
                where: {
                    id: prescriptionId,
                    caseDiagnosis: {
                        vetCase: {
                            clinicId,
                        },
                    },
                },
                include: {
                    caseDiagnosis: {
                        include: {
                            vetCase: {
                                include: {
                                    pet: {
                                        select: {
                                            id: true,
                                            petId: true,
                                            name: true,
                                            species: true,
                                            breed: true,
                                            owner: {
                                                select: { id: true, firstName: true, lastName: true, customerId: true },
                                            },
                                        },
                                    },
                                    vet: {
                                        select: { id: true, firstName: true, lastName: true, email: true, role: true },
                                    },
                                    clinic: { select: { id: true, clinicName: true } },
                                },
                            },
                        },
                    },
                    pharmacyDeliveries: {
                        include: {
                            staff: { select: { id: true, firstName: true, lastName: true } },
                            pet: { select: { id: true, name: true } },
                            customer: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                },
            });

            if (!prescription) {
                throw new Error('Prescription not found');
            }

            // Transform the data
            return {
                ...prescription,
                pet: prescription.caseDiagnosis.vetCase.pet,
                vet: prescription.caseDiagnosis.vetCase.vet,
                clinic: prescription.caseDiagnosis.vetCase.clinic,
                diagnosis: prescription.caseDiagnosis.diagnosis,
                diagnosisNotes: prescription.caseDiagnosis.notes,
            };
        } catch (error) {
            logger.error(`Error fetching prescription: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get prescriptions for a specific pet
     */
    static async getPrescriptionsByPet(clinicId, petId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            // Verify pet exists and belongs to clinic
            const pet = await prisma.pet.findFirst({
                where: { id: petId, clinicId },
            });

            if (!pet) {
                throw new Error('Pet not found in this clinic');
            }

            const whereCondition = {
                caseDiagnosis: {
                    vetCase: {
                        clinicId,
                        petId,
                    },
                },
                deletedAt: null,
            };

            const total = await prisma.prescription.count({ where: whereCondition });

            const prescriptions = await prisma.prescription.findMany({
                where: whereCondition,
                include: {
                    caseDiagnosis: {
                        include: {
                            vetCase: {
                                include: {
                                    vet: {
                                        select: { id: true, firstName: true, lastName: true, email: true },
                                    },
                                },
                            },
                        },
                    },
                    pharmacyDeliveries: {
                        include: {
                            staff: { select: { id: true, firstName: true, lastName: true } },
                        },
                    },
                },
                orderBy: { prescribedAt: 'desc' },
                skip,
                take: limit,
            });

            return {
                prescriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching pet prescriptions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get prescriptions prescribed by a specific vet
     */
    static async getPrescriptionsByVet(clinicId, vetId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            // Verify vet exists and belongs to clinic
            const vet = await prisma.user.findFirst({
                where: { id: vetId, clinicId, role: 'VET' },
            });

            if (!vet) {
                throw new Error('Vet not found in this clinic');
            }

            const whereCondition = {
                caseDiagnosis: {
                    vetCase: {
                        clinicId,
                        vetId,
                    },
                },
                deletedAt: null,
            };

            const total = await prisma.prescription.count({ where: whereCondition });

            const prescriptions = await prisma.prescription.findMany({
                where: whereCondition,
                include: {
                    caseDiagnosis: {
                        include: {
                            vetCase: {
                                include: {
                                    pet: {
                                        select: {
                                            id: true,
                                            petId: true,
                                            name: true,
                                            owner: {
                                                select: { id: true, firstName: true, lastName: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    pharmacyDeliveries: true,
                },
                orderBy: { prescribedAt: 'desc' },
                skip,
                take: limit,
            });

            return {
                prescriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching vet prescriptions: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get active (undelivered) prescriptions for a clinic
     */
    static async getActivePrescriptions(clinicId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            // Get all prescriptions with their delivery count
            const whereCondition = {
                caseDiagnosis: {
                    vetCase: {
                        clinicId,
                    },
                },
                deletedAt: null,
            };

            const total = await prisma.prescription.count({ where: whereCondition });

            const prescriptions = await prisma.prescription.findMany({
                where: whereCondition,
                include: {
                    caseDiagnosis: {
                        include: {
                            vetCase: {
                                include: {
                                    pet: {
                                        select: {
                                            id: true,
                                            petId: true,
                                            name: true,
                                            owner: {
                                                select: { id: true, firstName: true, lastName: true },
                                            },
                                        },
                                    },
                                    vet: {
                                        select: { id: true, firstName: true, lastName: true },
                                    },
                                },
                            },
                        },
                    },
                    pharmacyDeliveries: true,
                },
                orderBy: { prescribedAt: 'desc' },
                skip,
                take: limit,
            });

            // Filter: only show prescriptions with no deliveries or partial deliveries
            const activePrescriptions = prescriptions.map((p) => ({
                ...p,
                pet: p.caseDiagnosis.vetCase.pet,
                vet: p.caseDiagnosis.vetCase.vet,
                clinic: p.caseDiagnosis.vetCase.clinic,
                diagnosis: p.caseDiagnosis.diagnosis,
                diagnosisNotes: p.caseDiagnosis.notes,
                totalDelivered: p.pharmacyDeliveries.reduce((sum, d) => sum + d.quantity, 0),
                isActive: p.pharmacyDeliveries.reduce((sum, d) => sum + d.quantity, 0) < 1,
            })).filter((p) => p.totalDelivered < 1);

            return {
                prescriptions: activePrescriptions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error(`Error fetching active prescriptions: ${error.message}`);
            throw error;
        }
    }
}

module.exports = PrescriptionService;
