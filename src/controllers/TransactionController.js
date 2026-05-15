const TransactionService = require("../services/TransactionService");
const { errorResponse, successResponse } = require("../utils/response");

class TransactionController {
    async getTransactionsByClinic(req, res) {
        try {
            const { clinicId } = req.params;
            const transactions = await TransactionService.getTransactionsByClinic(clinicId);
            return res.json(transactions);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return errorResponse(res, 500, "Failed to fetch transactions", error);
        }
    }

    async createTransaction(req, res) {
        try {
            const { clinicId } = req.params;
            const transactionData = { ...req.body, clinicId };
            const transaction = await TransactionService.createTransaction(transactionData);
            return successResponse(res, 201, "Transaction created successfully", transaction);
        } catch (error) {
            console.error("Error creating transaction:", error);
            return errorResponse(res, 500, "Failed to create transaction", error);
        }
    }

    async updateTransaction(req, res) {
        try {
            const { clinicId, id } = req.params;
            const transaction = await TransactionService.updateTransaction(id, clinicId, req.body);
            return successResponse(res, 200, "Transaction updated successfully", transaction);
        } catch (error) {
            console.error("Error updating transaction:", error);
            return errorResponse(res, 500, "Failed to update transaction", error);
        }
    }

    async deleteTransaction(req, res) {
        try {
            const { clinicId, id } = req.params;
            await TransactionService.deleteTransaction(id, clinicId);
            return successResponse(res, 200, "Transaction deleted successfully");
        } catch (error) {
            console.error("Error deleting transaction:", error);
            return errorResponse(res, 500, "Failed to delete transaction", error);
        }
    }
}

module.exports = new TransactionController();
