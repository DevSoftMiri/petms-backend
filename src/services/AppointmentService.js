const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS, PAGINATION, APPOINTMENT_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class AppointmentService {
    /**
     * Get all appointments for a clinic
     */
    static async getAllAppointments(clinicId, page = 1, limit = PAGINATION.DEFAULT_LIMIT, search = '') {
        try {
            const skip = (page - 1) * limit;

            const where = {
                clinicId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { reason: { contains: search, mode: 'insensitive' } },
                        { pet: { name: { contains: search, mode: 'insensitive' } } },
                        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
                    ],
                }),
            };

            const [appointments, total] = await Promise.all([
                prisma.appointment.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        pet: true,
                        customer: true,
                        vet: { select: { firstName: true, lastName: true, username: true } },
                    },
                    orderBy: { appointmentDate: 'desc' },
                }),
                prisma.appointment.count({ where }),
            ]);

            return {
                appointments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error in getAllAppointments:', error);
            throw new AppError('Failed to fetch appointments', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get appointment by ID
     */
    static async getAppointmentById(clinicId, appointmentId) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: {
                    pet: true,
                    customer: true,
                    vet: true,
                },
            });

            if (!appointment || appointment.clinicId !== clinicId) {
                throw new AppError(
                    'Appointment not found',
                    HTTP_STATUS.NOT_FOUND,
                    'APPOINTMENT_NOT_FOUND'
                );
            }

            return appointment;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in getAppointmentById:', error);
            throw new AppError('Failed to fetch appointment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create appointment
     */
    static async createAppointment(clinicId, data) {
        try {
            // Verify pet and customer belong to clinic
            const [pet, vet] = await Promise.all([
                prisma.pet.findUnique({ where: { id: data.petId } }),
                prisma.user.findUnique({ where: { id: data.vetId } }),
            ]);

            if (!pet || pet.clinicId !== clinicId) {
                throw new AppError('Pet not found', HTTP_STATUS.NOT_FOUND, 'PET_NOT_FOUND');
            }

            if (!vet || vet.clinicId !== clinicId || !['VET', 'ADMIN'].includes(vet.role)) {
                throw new AppError('Vet not found', HTTP_STATUS.NOT_FOUND, 'VET_NOT_FOUND');
            }

            const appointment = await prisma.appointment.create({
                data: {
                    clinicId,
                    petId: data.petId,
                    customerId: data.customerId,
                    vetId: data.vetId,
                    appointmentDate: data.appointmentDate,
                    reason: data.reason,
                    status: APPOINTMENT_STATUS.PENDING,
                    notes: data.notes,
                },
            });

            logger.info(`Appointment created: ${appointment.id}`);

            return appointment;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in createAppointment:', error);
            throw new AppError('Failed to create appointment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update appointment
     */
    static async updateAppointment(clinicId, appointmentId, data) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
            });

            if (!appointment || appointment.clinicId !== clinicId) {
                throw new AppError(
                    'Appointment not found',
                    HTTP_STATUS.NOT_FOUND,
                    'APPOINTMENT_NOT_FOUND'
                );
            }

            const updatedAppointment = await prisma.appointment.update({
                where: { id: appointmentId },
                data: {
                    appointmentDate: data.appointmentDate || appointment.appointmentDate,
                    reason: data.reason || appointment.reason,
                    status: data.status || appointment.status,
                    notes: data.notes || appointment.notes,
                    diagnosis: data.diagnosis || appointment.diagnosis,
                    treatment: data.treatment || appointment.treatment,
                },
            });

            logger.info(`Appointment updated: ${appointmentId}`);

            return updatedAppointment;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in updateAppointment:', error);
            throw new AppError('Failed to update appointment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Cancel appointment
     */
    static async cancelAppointment(clinicId, appointmentId) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
            });

            if (!appointment || appointment.clinicId !== clinicId) {
                throw new AppError(
                    'Appointment not found',
                    HTTP_STATUS.NOT_FOUND,
                    'APPOINTMENT_NOT_FOUND'
                );
            }

            const cancelledAppointment = await prisma.appointment.update({
                where: { id: appointmentId },
                data: { status: APPOINTMENT_STATUS.CANCELLED },
            });

            logger.info(`Appointment cancelled: ${appointmentId}`);

            return cancelledAppointment;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in cancelAppointment:', error);
            throw new AppError('Failed to cancel appointment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete appointment
     */
    static async deleteAppointment(clinicId, appointmentId) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
            });

            if (!appointment || appointment.clinicId !== clinicId) {
                throw new AppError(
                    'Appointment not found',
                    HTTP_STATUS.NOT_FOUND,
                    'APPOINTMENT_NOT_FOUND'
                );
            }

            await prisma.appointment.update({
                where: { id: appointmentId },
                data: { deletedAt: new Date() },
            });

            logger.info(`Appointment deleted: ${appointmentId}`);

            return { message: 'Appointment deleted successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Error in deleteAppointment:', error);
            throw new AppError('Failed to delete appointment', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        }
    }
}

module.exports = AppointmentService;
