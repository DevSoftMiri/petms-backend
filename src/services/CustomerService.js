const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const logger = require('../utils/logger');
const IdGenerator = require('../utils/idGenerator');

class CustomerService {
    /**
     * Get all customers for a clinic
     */
    static async getAllCustomers(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                clinicId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { firstName: { contains: search, mode: 'insensitive' } },
                        { lastName: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } },
                        { phoneNumber: { contains: search, mode: 'insensitive' } },
                        { customerId: { contains: search, mode: 'insensitive' } },
                        { code: { contains: search, mode: 'insensitive' } },
                    ],
                }),
            };

            const [customers, total] = await Promise.all([
                prisma.customer.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        pets: { where: { deletedAt: null } },
                        _count: { select: { pets: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.customer.count({ where }),
            ]);

            return {
                customers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllCustomers:', error);
            throw new AppError('Failed to fetch customers', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get customer by ID with pets and appointments
     */
    static async getCustomerById(clinicId, customerId) {
        try {
            // Support both id and customerId
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: customerId },
                        { customerId: customerId },
                    ],
                },
                include: {
                    pets: { where: { deletedAt: null } },
                    appointments: { where: { deletedAt: null } },
                },
            });

            if (!customer || customer.clinicId !== clinicId) {
                throw new AppError(
                    'Customer not found',
                    HTTP_STATUS.NOT_FOUND,
                    'CUSTOMER_NOT_FOUND'
                );
            }

            return customer;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getCustomerById:', error);
            throw new AppError('Failed to fetch customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create customer with optional pets
     * @param {string} clinicId
     * @param {object} data - { firstName, lastName, email, phoneNumber, address, city, state, zipCode, country, pets: [...] }
     * @returns {Promise<object>} - Created customer with pets
     */
    static async createCustomer(clinicId, data) {
        try {
            logger.info(`Creating customer with data:`, JSON.stringify(data, null, 2));

            // Generate customerId and code (before transaction)
            const customerId = await IdGenerator.generateCustomerId();
            const fullName = `${data.firstName} ${data.lastName}`;
            const code = IdGenerator.generateCustomerCode(fullName, data.phoneNumber);

            // Generate pet IDs before transaction
            let petIds = [];
            if (data.pets && Array.isArray(data.pets) && data.pets.length > 0) {
                logger.info(`Generating ${data.pets.length} pet IDs`);
                petIds = await Promise.all(
                    data.pets.map(() => IdGenerator.generatePetId())
                );
                logger.info(`Generated pet IDs:`, petIds);
            }

            // Use transaction for customer and pets creation
            const customer = await prisma.$transaction(async (tx) => {
                // Create customer
                const newCustomer = await tx.customer.create({
                    data: {
                        clinicId,
                        customerId,
                        code,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email || null,
                        phoneNumber: data.phoneNumber || null,
                        address: data.address || null,
                        city: data.city || null,
                        state: data.state || null,
                        zipCode: data.zipCode || null,
                        country: data.country || null,
                    },
                });

                logger.info(`Customer created: ${newCustomer.id} (${newCustomer.customerId})`);

                // Create pets if provided
                if (data.pets && Array.isArray(data.pets) && data.pets.length > 0) {
                    logger.info(`Creating ${data.pets.length} pets for customer ${newCustomer.id}`);

                    const petsToCreate = data.pets.map((pet, index) => {
                        const petData = {
                            clinicId,
                            customerId: newCustomer.id,
                            petId: petIds[index],
                            name: pet.name,
                            species: pet.species,
                            gender: pet.gender || null,
                            colour: pet.colour || null,
                            breed: pet.breed || null,
                            age: pet.age ? parseInt(pet.age) : null,
                            weight: pet.weight ? parseFloat(pet.weight) : null,
                            medicalNotes: pet.medicalNotes || null,
                            dateOfBirth: pet.dateOfBirth || null,
                        };
                        logger.info(`Pet data:`, JSON.stringify(petData, null, 2));
                        return petData;
                    });

                    const createdPets = await tx.pet.createMany({
                        data: petsToCreate,
                    });
                    logger.info(`Created ${createdPets.count} pets for customer ${newCustomer.id}`);
                }

                // Fetch the customer with pets
                const customerWithPets = await tx.customer.findUnique({
                    where: { id: newCustomer.id },
                    include: {
                        pets: { where: { deletedAt: null } },
                    },
                });

                logger.info(`Customer with pets:`, JSON.stringify(customerWithPets, null, 2));
                return customerWithPets;
            });

            return customer;
        } catch (error) {
            logger.error('Error in createCustomer:', error.message);
            logger.error('Error stack:', error.stack);
            throw new AppError('Failed to create customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update customer
     */
    static async updateCustomer(clinicId, customerId, data) {
        try {
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: customerId },
                        { customerId: customerId },
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

            // Regenerate code if name or phone changed
            let code = customer.code;
            if (data.firstName || data.lastName || data.phoneNumber) {
                const fullName = `${data.firstName || customer.firstName} ${data.lastName || customer.lastName}`;
                code = IdGenerator.generateCustomerCode(fullName, data.phoneNumber || customer.phoneNumber);
            }

            const updatedCustomer = await prisma.customer.update({
                where: { id: customer.id },
                data: {
                    firstName: data.firstName || customer.firstName,
                    lastName: data.lastName || customer.lastName,
                    code: code,
                    email: data.email !== undefined ? data.email : customer.email,
                    phoneNumber: data.phoneNumber || customer.phoneNumber,
                    address: data.address !== undefined ? data.address : customer.address,
                    city: data.city !== undefined ? data.city : customer.city,
                    state: data.state !== undefined ? data.state : customer.state,
                    zipCode: data.zipCode !== undefined ? data.zipCode : customer.zipCode,
                    country: data.country !== undefined ? data.country : customer.country,
                },
                include: {
                    pets: { where: { deletedAt: null } },
                },
            });

            logger.info(`Customer updated: ${customerId}`);

            return updatedCustomer;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updateCustomer:', error);
            throw new AppError('Failed to update customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete customer (soft delete)
     * Optionally cascade delete pets
     */
    static async deleteCustomer(clinicId, customerId, cascadeDeletePets = true) {
        try {
            const customer = await prisma.customer.findFirst({
                where: {
                    OR: [
                        { id: customerId },
                        { customerId: customerId },
                    ],
                },
                include: {
                    pets: true,
                },
            });

            if (!customer || customer.clinicId !== clinicId) {
                throw new AppError(
                    'Customer not found',
                    HTTP_STATUS.NOT_FOUND,
                    'CUSTOMER_NOT_FOUND'
                );
            }

            // Soft delete customer
            await prisma.customer.update({
                where: { id: customer.id },
                data: { deletedAt: new Date() },
            });

            // Optionally cascade delete pets
            if (cascadeDeletePets && customer.pets && customer.pets.length > 0) {
                await prisma.pet.updateMany({
                    where: { customerId: customer.id },
                    data: { deletedAt: new Date() },
                });
                logger.info(`Cascade deleted ${customer.pets.length} pets for customer ${customer.id}`);
            }

            logger.info(`Customer deleted: ${customerId}`);

            return { message: 'Customer deleted successfully', deletedPetsCount: customer.pets?.length || 0 };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deleteCustomer:', error);
            throw new AppError('Failed to delete customer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = CustomerService;
