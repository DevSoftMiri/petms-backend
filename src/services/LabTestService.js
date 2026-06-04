const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class LabTestService {
    async getLabTestsByClinic(clinicId) {
        try {
            const tests = await prisma.labTest.findMany({
                where: { clinicId, deletedAt: null },
                include: {
                    pet: {
                        include: {
                            owner: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    code: true,
                                    customerId: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { date: "desc" },
            });

            // Transform to include customerCode at top level and map id to _id
            return tests.map((test) => {
                const owner = test.pet?.owner;
                return {
                    ...test,
                    _id: test.id,
                    customerCode: owner?.code || owner?.customerId || null,
                    customerName: owner
                        ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
                        : null,
                };
            });
        } catch (error) {
            console.error("Error in getLabTestsByClinic:", error);
            throw error;
        }
    }

    async createLabTest(testData) {
        try {
            console.log('[LabTestService] Creating lab test with data:', {
                clinicId: testData.clinicId,
                petName: testData.petName,
                testType: testData.testType,
                reportUrl: testData.reportUrl
            });

            const test = await prisma.labTest.create({
                data: {
                    clinicId: testData.clinicId,
                    petId: testData.petId || null,
                    petName: testData.petName,
                    testType: testData.testType,
                    date: testData.date ? new Date(testData.date) : new Date(),
                    result: testData.result,
                    status: testData.status || "Complete",
                    veterinarian: testData.veterinarian,
                    notes: testData.notes,
                    reportUrl: testData.reportUrl || null,
                },
                include: {
                    pet: {
                        include: {
                            owner: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    code: true,
                                    customerId: true,
                                },
                            },
                        },
                    },
                },
            });

            console.log('[LabTestService] Created lab test with ID:', test.id, 'reportUrl:', test.reportUrl);

            const owner = test.pet?.owner;
            return {
                ...test,
                _id: test.id,
                customerCode: owner?.code || owner?.customerId || null,
                customerName: owner
                    ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
                    : null,
            };
        } catch (error) {
            console.error("Error in createLabTest:", error);
            throw error;
        }
    }

    async updateLabTest(id, clinicId, testData) {
        try {
            console.log('[LabTestService] Updating lab test', id, 'with reportUrl:', testData.reportUrl);

            await prisma.labTest.updateMany({
                where: { id, clinicId },
                data: {
                    petId: testData.petId,
                    petName: testData.petName,
                    testType: testData.testType,
                    date: testData.date ? new Date(testData.date) : undefined,
                    result: testData.result,
                    status: testData.status,
                    veterinarian: testData.veterinarian,
                    notes: testData.notes,
                    reportUrl: testData.reportUrl !== undefined ? testData.reportUrl : undefined,
                    updatedAt: new Date(),
                },
            });

            // Fetch the updated record to return the full object with all fields
            const test = await prisma.labTest.findUnique({
                where: { id },
                include: {
                    pet: {
                        include: {
                            owner: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    code: true,
                                    customerId: true,
                                },
                            },
                        },
                    },
                },
            });

            console.log('[LabTestService] Updated lab test, returning:', { id: test?.id, reportUrl: test?.reportUrl });

            const owner = test?.pet?.owner;
            return {
                ...test,
                _id: test?.id,
                customerCode: owner?.code || owner?.customerId || null,
                customerName: owner
                    ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
                    : null,
            };
        } catch (error) {
            console.error("Error in updateLabTest:", error);
            throw error;
        }
    }

    async deleteLabTest(id, clinicId) {
        try {
            await prisma.labTest.updateMany({
                where: { id, clinicId },
                data: { deletedAt: new Date() },
            });
        } catch (error) {
            console.error("Error in deleteLabTest:", error);
            throw error;
        }
    }
}

module.exports = new LabTestService();
