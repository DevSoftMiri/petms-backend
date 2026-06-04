const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STORE_TYPES = ["Food", "Bed", "Treat"];

const toNumber = (value, fallback = 0) => {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toInteger = (value, fallback = 0) => {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const toDate = (value) => (value ? new Date(value) : null);

const validateStoreItem = (itemData) => {
    if (!itemData.name || !itemData.name.trim()) {
        const error = new Error("Product name is required");
        error.statusCode = 422;
        throw error;
    }

    if (!itemData.category || !STORE_TYPES.includes(itemData.category)) {
        const error = new Error("Valid store type is required");
        error.statusCode = 422;
        throw error;
    }

    if (toInteger(itemData.quantity) < 0) {
        const error = new Error("Quantity cannot be negative");
        error.statusCode = 422;
        throw error;
    }
};

const mapStoreItemData = (itemData) => ({
    name: itemData.name.trim(),
    category: itemData.category,
    description: itemData.description || null,
    price: toNumber(itemData.price),
    quantity: toInteger(itemData.quantity),
    supplier: itemData.supplier || itemData.vendor || null,
    expiryDate: toDate(itemData.expiryDate),
    inwardDate: toDate(itemData.inwardDate),
    outwardDate: toDate(itemData.outwardDate),
});

class StoreItemService {
    async getStoreItemsByClinic(clinicId, search = "") {
        const searchQuery = search && search.trim();
        return prisma.storeItem.findMany({
            where: {
                clinicId,
                deletedAt: null,
                ...(searchQuery && {
                    OR: [
                        { name: { contains: searchQuery, mode: "insensitive" } },
                        { supplier: { contains: searchQuery, mode: "insensitive" } },
                        { category: { contains: searchQuery, mode: "insensitive" } },
                    ],
                }),
            },
            orderBy: { name: "asc" },
        });
    }

    async createStoreItem(itemData) {
        validateStoreItem(itemData);
        return prisma.storeItem.create({
            data: {
                clinicId: itemData.clinicId,
                ...mapStoreItemData(itemData),
            },
        });
    }

    async updateStoreItem(id, clinicId, itemData) {
        const existing = await prisma.storeItem.findFirst({
            where: { id, clinicId, deletedAt: null },
        });

        if (!existing) {
            const error = new Error("Store item not found");
            error.statusCode = 404;
            throw error;
        }

        const merged = { ...existing, ...itemData };
        validateStoreItem(merged);

        return prisma.storeItem.update({
            where: { id },
            data: mapStoreItemData(merged),
        });
    }

    async updateQuantity(id, clinicId, itemData) {
        const existing = await prisma.storeItem.findFirst({
            where: { id, clinicId, deletedAt: null },
        });

        if (!existing) {
            const error = new Error("Store item not found");
            error.statusCode = 404;
            throw error;
        }

        const quantity = toInteger(itemData.quantity);
        if (quantity < 0) {
            const error = new Error("Quantity cannot be negative");
            error.statusCode = 422;
            throw error;
        }

        return prisma.storeItem.update({
            where: { id },
            data: {
                quantity,
                outwardDate: toDate(itemData.outwardDate),
            },
        });
    }

    async deleteStoreItem(id, clinicId) {
        return prisma.storeItem.updateMany({
            where: { id, clinicId },
            data: { deletedAt: new Date() },
        });
    }
}

module.exports = new StoreItemService();
