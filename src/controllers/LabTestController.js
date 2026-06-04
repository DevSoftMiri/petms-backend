const LabTestService = require("../services/LabTestService");
const { errorResponse, successResponse } = require("../utils/response");

class LabTestController {
    async getLabTestsByClinic(req, res) {
        try {
            const { clinicId } = req.params;
            const tests = await LabTestService.getLabTestsByClinic(clinicId);
            return res.json(tests);
        } catch (error) {
            console.error("Error fetching lab tests:", error);
            return errorResponse(res, 500, "Failed to fetch lab tests", error);
        }
    }

    async createLabTest(req, res) {
        try {
            const { clinicId } = req.params;
            const testData = { ...req.body, clinicId };
            const test = await LabTestService.createLabTest(testData);
            return successResponse(res, 201, "Lab test created successfully", test);
        } catch (error) {
            console.error("Error creating lab test:", error);
            return errorResponse(res, 500, "Failed to create lab test", error);
        }
    }

    async updateLabTest(req, res) {
        try {
            const { clinicId, id } = req.params;
            console.log('[LabTestController] updateLabTest called with body:', { reportUrl: req.body.reportUrl });
            const test = await LabTestService.updateLabTest(id, clinicId, req.body);
            console.log('[LabTestController] updateLabTest returning:', { id: test?.id, reportUrl: test?.reportUrl });
            return successResponse(res, 200, "Lab test updated successfully", test);
        } catch (error) {
            console.error("Error updating lab test:", error);
            return errorResponse(res, 500, "Failed to update lab test", error);
        }
    }

    async deleteLabTest(req, res) {
        try {
            const { clinicId, id } = req.params;
            await LabTestService.deleteLabTest(id, clinicId);
            return successResponse(res, 200, "Lab test deleted successfully");
        } catch (error) {
            console.error("Error deleting lab test:", error);
            return errorResponse(res, 500, "Failed to delete lab test", error);
        }
    }
}

module.exports = new LabTestController();
