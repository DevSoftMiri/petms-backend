const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class StoreItemService {
    async getStoreItemsByClinic(clinicId) {
        const items = await prisma.storeItem.findMany({
            where: { clinicId, deletedAt: null },
            orderBy: { name: "asc" },
        });
        return items;
    }

    async createStoreItem(itemData) {
        const item = await prisma.storeItem.create({
            data: {
                clinicId: itemData.clinicId,
                name: itemData.name,
                category: itemData.category,
                description: itemData.description,
                price: itemData.price ? parseFloat(itemData.price) : null,
                quantity: itemData.quantity || 0,
                supplier: itemData.supplier,
                expiryDate: itemData.expiryDate ? new Date(itemData.expiryDate) : null,
            },
        });
        return item;
    }

    async updateStoreItem(id, clinicId, itemData) {
        const item = await prisma.storeItem.updateMany({
            where: { id, clinicId },
            data: {
                name: itemData.name,
                category: itemData.category,
                description: itemData.description,
                price: itemData.price ? parseFloat(itemData.price) : undefined,
                quantity: itemData.quantity,
                supplier: itemData.supplier,
                expiryDate: itemData.expiryDate ? new Date(itemData.expiryDate) : null,
                updatedAt: new Date(),
            },
        });
        return item;
    }

    async deleteStoreItem(id, clinicId) {
        await prisma.storeItem.updateMany({
            where: { id, clinicId },
            data: { deletedAt: new Date() },
        });
    }
}

module.exports = new StoreItemService();
