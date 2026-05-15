const prisma = require('../lib/prisma');

/**
 * ID and Code Generator Utility
 */
class IdGenerator {
    /**
     * Generate unique Customer ID in format: CUS-XXXX
     * @returns {Promise<string>}
     */
    static async generateCustomerId() {
        try {
            // Get the highest number currently used
            const lastCustomer = await prisma.customer.findFirst({
                select: { customerId: true },
                orderBy: { createdAt: 'desc' },
                where: { customerId: { startsWith: 'CUS-' } },
            });

            let nextNumber = 1;
            if (lastCustomer && lastCustomer.customerId) {
                const match = lastCustomer.customerId.match(/CUS-(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            const customerId = `CUS-${String(nextNumber).padStart(4, '0')}`;
            return customerId;
        } catch (error) {
            // Fallback: use timestamp-based ID if query fails
            console.error('Error generating customer ID:', error);
            const timestamp = Date.now().toString().slice(-4);
            return `CUS-${String(Math.random() * 10000 | 0).padStart(4, '0')}`;
        }
    }

    /**
     * Generate unique Pet ID in format: PET-XXXX
     * @returns {Promise<string>}
     */
    static async generatePetId() {
        try {
            // Get the highest number currently used
            const lastPet = await prisma.pet.findFirst({
                select: { petId: true },
                orderBy: { createdAt: 'desc' },
                where: { petId: { startsWith: 'PET-' } },
            });

            let nextNumber = 1;
            if (lastPet && lastPet.petId) {
                const match = lastPet.petId.match(/PET-(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }

            const petId = `PET-${String(nextNumber).padStart(4, '0')}`;
            return petId;
        } catch (error) {
            // Fallback: use timestamp-based ID if query fails
            console.error('Error generating pet ID:', error);
            return `PET-${String(Math.random() * 10000 | 0).padStart(4, '0')}`;
        }
    }

    /**
     * Generate customer code
     * Format: First 2 letters of name (uppercase) + Last 3 digits of phone number
     * 
     * Example:
     * Name: Hardik Jain
     * Phone: 9876543210
     * Result: HA210
     * 
     * @param {string} name - Customer name
     * @param {string} phoneNumber - Customer phone number
     * @returns {string}
     */
    static generateCustomerCode(name, phoneNumber) {
        try {
            if (!name || typeof name !== 'string') {
                throw new Error('Name is required and must be a string');
            }

            // Get first 2 letters of name (removing spaces)
            const nameWithoutSpaces = name.replace(/\s+/g, '');
            const namePrefix = nameWithoutSpaces.substring(0, 2).toUpperCase();

            // Get last 3 digits of phone number
            let phoneSuffix = '000'; // Default if phone is not provided
            if (phoneNumber && typeof phoneNumber === 'string') {
                const digitsOnly = phoneNumber.replace(/\D/g, '');
                if (digitsOnly.length >= 3) {
                    phoneSuffix = digitsOnly.slice(-3);
                }
            }

            const code = `${namePrefix}${phoneSuffix}`;
            return code;
        } catch (error) {
            throw new Error(`Failed to generate customer code: ${error.message}`);
        }
    }

    /**
     * Generate full customer with ID and code
     * @param {object} customerData - Customer data
     * @returns {Promise<object>}
     */
    static async generateCustomerWithIds(customerData) {
        try {
            const customerId = await this.generateCustomerId();
            const code = this.generateCustomerCode(
                customerData.firstName ? `${customerData.firstName} ${customerData.lastName}` : '',
                customerData.phoneNumber
            );

            return {
                ...customerData,
                customerId,
                code,
            };
        } catch (error) {
            throw new Error(`Failed to generate customer with IDs: ${error.message}`);
        }
    }

    /**
     * Generate full pet with ID
     * @param {object} petData - Pet data
     * @returns {Promise<object>}
     */
    static async generatePetWithId(petData) {
        try {
            const petId = await this.generatePetId();

            return {
                ...petData,
                petId,
            };
        } catch (error) {
            throw new Error(`Failed to generate pet with ID: ${error.message}`);
        }
    }
}

module.exports = IdGenerator;
