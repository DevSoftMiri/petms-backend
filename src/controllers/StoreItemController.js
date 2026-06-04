const StoreItemService = require("../services/StoreItemService");
const { errorResponse, successResponse } = require("../utils/response");

class StoreItemController {
    async getStoreItemsByClinic(req, res) {
        try {
            const { clinicId } = req.params;
            const items = await StoreItemService.getStoreItemsByClinic(clinicId, req.query.search || "");
            return res.json(items);
        } catch (error) {
            console.error("Error fetching store items:", error);
            return errorResponse(res, 500, "Failed to fetch store items", error);
        }
    }

    async createStoreItem(req, res) {
        try {
            const { clinicId } = req.params;
            const itemData = { ...req.body, clinicId };
            const item = await StoreItemService.createStoreItem(itemData);
            return successResponse(res, 201, "Store item created successfully", item);
        } catch (error) {
            console.error("Error creating store item:", error);
            return errorResponse(res, error.statusCode || 500, error.message || "Failed to create store item", error);
        }
    }

    async updateStoreItem(req, res) {
        try {
            const { clinicId, id } = req.params;
            const item = await StoreItemService.updateStoreItem(id, clinicId, req.body);
            return successResponse(res, 200, "Store item updated successfully", item);
        } catch (error) {
            console.error("Error updating store item:", error);
            return errorResponse(res, error.statusCode || 500, error.message || "Failed to update store item", error);
        }
    }

    async updateQuantity(req, res) {
        try {
            const { clinicId, id } = req.params;
            const item = await StoreItemService.updateQuantity(id, clinicId, req.body);
            return successResponse(res, 200, "Store item quantity updated successfully", item);
        } catch (error) {
            console.error("Error updating store item quantity:", error);
            return errorResponse(res, error.statusCode || 500, error.message || "Failed to update store item quantity", error);
        }
    }

    async deleteStoreItem(req, res) {
        try {
            const { clinicId, id } = req.params;
            await StoreItemService.deleteStoreItem(id, clinicId);
            return successResponse(res, 200, "Store item deleted successfully");
        } catch (error) {
            console.error("Error deleting store item:", error);
            return errorResponse(res, 500, "Failed to delete store item", error);
        }
    }
}

module.exports = new StoreItemController();
