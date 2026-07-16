const SuperAdminFundsService = require("../services/SuperAdminFundsService");
const { errorResponse, successResponse } = require("../utils/response");

class SuperAdminFundsController {
    async getFunds(req, res) {
        try {
            const funds = await SuperAdminFundsService.getFunds();
            return res.json(funds);
        } catch (error) {
            console.error("Error fetching super admin funds:", error);
            return errorResponse(res, 500, error?.message || "Failed to fetch funds");
        }
    }

    async createFund(req, res) {
        try {
            const { donorName, amount, date, paymentMode, receivedBy, proofUrl, proofFileName, proofMimeType } = req.body;

            if (!donorName || amount === undefined || amount === null || !date || !paymentMode || !receivedBy) {
                return errorResponse(res, 400, "Donor name, amount, date, payment mode, and received by are required");
            }

            const fund = await SuperAdminFundsService.createFund({
                donorName,
                amount,
                date,
                paymentMode,
                receivedBy,
                proofUrl,
                proofFileName,
                proofMimeType,
            });

            return successResponse(res, 201, "Fund entry created successfully", fund);
        } catch (error) {
            console.error("Error creating super admin fund:", error);
            return errorResponse(res, 500, error?.message || "Failed to create fund entry");
        }
    }
}

module.exports = new SuperAdminFundsController();
