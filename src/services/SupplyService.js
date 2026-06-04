const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class SupplyService {
    async getSuppliesByClinic(clinicId) {
        const supplies = await prisma.supply.findMany({
            where: { clinicId, deletedAt: null },
            orderBy: { name: "asc" },
        });
        return supplies;
    }

    async createSupply(supplyData) {
        const supply = await prisma.supply.create({
            data: {
                clinicId: supplyData.clinicId,
                name: supplyData.name || supplyData.category || "Unnamed Supply",
                category: supplyData.category,
                description: supplyData.description,
                quantity: parseInt(supplyData.quantity) || 0,
                reorderLevel: parseInt(supplyData.reorderLevel) || 10,
                cost: parseFloat(supplyData.cost) || 0,
                supplier: supplyData.supplier,
                expiryDate: supplyData.expiryDate ? new Date(supplyData.expiryDate) : null,
            },
        });
        return supply;
    }

    async updateSupply(id, clinicId, supplyData) {
        const supply = await prisma.supply.updateMany({
            where: { id, clinicId },
            data: {
                name: supplyData.name || supplyData.category || "Unnamed Supply",
                category: supplyData.category,
                description: supplyData.description,
                quantity: parseInt(supplyData.quantity) || 0,
                reorderLevel: parseInt(supplyData.reorderLevel) || 10,
                cost: parseFloat(supplyData.cost) || 0,
                supplier: supplyData.supplier,
                expiryDate: supplyData.expiryDate ? new Date(supplyData.expiryDate) : null,
                updatedAt: new Date(),
            },
        });
        return supply;
    }

    async deleteSupply(id, clinicId) {
        await prisma.supply.updateMany({
            where: { id, clinicId },
            data: { deletedAt: new Date() },
        });
    }
}

module.exports = new SupplyService();
