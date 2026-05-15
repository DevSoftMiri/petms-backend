const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class TransactionService {
    async getTransactionsByClinic(clinicId) {
        const transactions = await prisma.transaction.findMany({
            where: { clinicId, deletedAt: null },
            orderBy: { date: "desc" },
        });
        return transactions;
    }

    async createTransaction(transactionData) {
        const transaction = await prisma.transaction.create({
            data: {
                clinicId: transactionData.clinicId,
                description: transactionData.description,
                type: transactionData.type,
                amount: parseFloat(transactionData.amount),
                date: transactionData.date ? new Date(transactionData.date) : new Date(),
                paymentMethod: transactionData.paymentMethod,
                category: transactionData.category,
                status: transactionData.status || "Completed",
                notes: transactionData.notes,
            },
        });
        return transaction;
    }

    async updateTransaction(id, clinicId, transactionData) {
        const transaction = await prisma.transaction.updateMany({
            where: { id, clinicId },
            data: {
                description: transactionData.description,
                type: transactionData.type,
                amount: transactionData.amount ? parseFloat(transactionData.amount) : undefined,
                date: transactionData.date ? new Date(transactionData.date) : undefined,
                paymentMethod: transactionData.paymentMethod,
                category: transactionData.category,
                status: transactionData.status,
                notes: transactionData.notes,
                updatedAt: new Date(),
            },
        });
        return transaction;
    }

    async deleteTransaction(id, clinicId) {
        await prisma.transaction.updateMany({
            where: { id, clinicId },
            data: { deletedAt: new Date() },
        });
    }
}

module.exports = new TransactionService();
