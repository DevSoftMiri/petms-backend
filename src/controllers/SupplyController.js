const SupplyService = require("../services/SupplyService");
const { errorResponse, successResponse } = require("../utils/response");

class SupplyController {
    async getSuppliesByClinic(req, res) {
        try {
            const { clinicId } = req.params;
            const supplies = await SupplyService.getSuppliesByClinic(clinicId);
            return res.json(supplies);
        } catch (error) {
            console.error("Error fetching supplies:", error);
            return errorResponse(res, 500, "Failed to fetch supplies", error);
        }
    }

    async createSupply(req, res) {
        try {
            const { clinicId } = req.params;
            const supplyData = { ...req.body, clinicId };
            const supply = await SupplyService.createSupply(supplyData);
            return successResponse(res, 201, "Supply created successfully", supply);
        } catch (error) {
            console.error("Error creating supply:", error);
            return errorResponse(res, 500, "Failed to create supply", error);
        }
    }

    async updateSupply(req, res) {
        try {
            const { clinicId, id } = req.params;
            const supply = await SupplyService.updateSupply(id, clinicId, req.body);
            return successResponse(res, 200, "Supply updated successfully", supply);
        } catch (error) {
            console.error("Error updating supply:", error);
            return errorResponse(res, 500, "Failed to update supply", error);
        }
    }

    async deleteSupply(req, res) {
        try {
            const { clinicId, id } = req.params;
            await SupplyService.deleteSupply(id, clinicId);
            return successResponse(res, 200, "Supply deleted successfully");
        } catch (error) {
            console.error("Error deleting supply:", error);
            return errorResponse(res, 500, "Failed to delete supply", error);
        }
    }
}

module.exports = new SupplyController();
