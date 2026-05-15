const DashboardService = require('../services/DashboardService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class DashboardController {
    /**
     * GET /api/v1/clinics/:clinicId/dashboard
     * Get dashboard statistics and data for a clinic
     */
    static getDashboard = asyncHandler(async (req, res) => {
        logger.info(`Dashboard requested for clinic: ${req.params.clinicId}`);

        const data = await DashboardService.getDashboardData(req.params.clinicId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data,
                message: 'Dashboard data retrieved successfully',
            })
        );
    });
}

module.exports = DashboardController;
