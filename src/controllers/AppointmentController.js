const { validationResult } = require('express-validator');
const AppointmentService = require('../services/AppointmentService');
const apiResponse = require('../utils/response');
const { HTTP_STATUS, PAGINATION } = require('../utils/constants');
const { asyncHandler } = require('../utils/errors');
const logger = require('../utils/logger');

class AppointmentController {
    /**
     * GET /api/v1/clinics/:clinicId/appointments
     * Get all appointments for a clinic
     */
    static getAll = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const search = req.query.search || '';

        const result = await AppointmentService.getAllAppointments(req.params.clinicId, page, limit, search);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.paginated(
                result.appointments,
                result.pagination.page,
                result.pagination.limit,
                result.pagination.total,
                'Appointments retrieved successfully'
            )
        );
    });

    /**
     * GET /api/v1/clinics/:clinicId/appointments/:appointmentId
     * Get appointment by ID
     */
    static getById = asyncHandler(async (req, res) => {
        const appointment = await AppointmentService.getAppointmentById(req.params.clinicId, req.params.appointmentId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: appointment,
                message: 'Appointment retrieved successfully',
            })
        );
    });

    /**
     * POST /api/v1/clinics/:clinicId/appointments
     * Create new appointment
     */
    static create = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const appointment = await AppointmentService.createAppointment(req.params.clinicId, req.body);

        res.status(HTTP_STATUS.CREATED).json(
            apiResponse.success({
                data: appointment,
                message: 'Appointment created successfully',
            })
        );
    });

    /**
     * PUT /api/v1/clinics/:clinicId/appointments/:appointmentId
     * Update appointment
     */
    static update = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(
                apiResponse.error('Validation failed', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors.array())
            );
        }

        const appointment = await AppointmentService.updateAppointment(req.params.clinicId, req.params.appointmentId, req.body);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: appointment,
                message: 'Appointment updated successfully',
            })
        );
    });

    /**
     * PATCH /api/v1/clinics/:clinicId/appointments/:appointmentId/cancel
     * Cancel appointment
     */
    static cancel = asyncHandler(async (req, res) => {
        const appointment = await AppointmentService.cancelAppointment(req.params.clinicId, req.params.appointmentId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                data: appointment,
                message: 'Appointment cancelled successfully',
            })
        );
    });

    /**
     * DELETE /api/v1/clinics/:clinicId/appointments/:appointmentId
     * Delete appointment
     */
    static delete = asyncHandler(async (req, res) => {
        const result = await AppointmentService.deleteAppointment(req.params.clinicId, req.params.appointmentId);

        res.status(HTTP_STATUS.OK).json(
            apiResponse.success({
                message: result.message,
            })
        );
    });
}

module.exports = AppointmentController;
