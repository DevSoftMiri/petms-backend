const prisma = require('../lib/prisma');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class DashboardService {
    /**
     * Get complete dashboard data for a clinic
     */
    static async getDashboardData(clinicId) {
        try {
            // Get current date (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get start of current month
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

            // Parallel fetch all dashboard statistics
            const [
                totalPets,
                totalCustomers,
                totalStaff,
                totalAppointments,
                todayAppointments,
                pendingAppointments,
                completedAppointments,
                totalGroomings,
                totalPharmacyRecords,
                totalSupplies,
                lowStockSupplies,
                monthlyRevenueData,
                recentAppointments,
                recentTransactions,
                upcomingAppointments,
            ] = await Promise.all([
                // Total Pets
                prisma.pet.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Total Customers
                prisma.customer.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Total Staff (Users with role ADMIN, VET, GROOMER, RECEPTIONIST, PHARMACIST, STAFF)
                prisma.user.count({
                    where: {
                        clinicId,
                        role: {
                            in: ['ADMIN', 'VET', 'GROOMER', 'RECEPTIONIST', 'PHARMACIST', 'STAFF'],
                        },
                        isActive: true,
                    },
                }),

                // Total Appointments
                prisma.appointment.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Today's Appointments
                prisma.appointment.count({
                    where: {
                        clinicId,
                        deletedAt: null,
                        appointmentDate: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                }),

                // Pending Appointments
                prisma.appointment.count({
                    where: {
                        clinicId,
                        deletedAt: null,
                        status: 'PENDING',
                    },
                }),

                // Completed Appointments
                prisma.appointment.count({
                    where: {
                        clinicId,
                        deletedAt: null,
                        status: 'COMPLETED',
                    },
                }),

                // Total Grooming Records
                prisma.groomingRecord.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Total Pharmacy Records
                prisma.pharmacyRecord.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Total Supplies
                prisma.supply.count({
                    where: { clinicId, deletedAt: null },
                }),

                // Low Stock Supplies (quantity <= reorderLevel)
                prisma.supply.findMany({
                    where: {
                        clinicId,
                        deletedAt: null,
                    },
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        quantity: true,
                        reorderLevel: true,
                    },
                }),

                // Monthly Revenue (sum of Income transactions in current month)
                prisma.transaction.aggregate({
                    where: {
                        clinicId,
                        deletedAt: null,
                        type: 'Income',
                        date: {
                            gte: monthStart,
                        },
                    },
                    _sum: {
                        amount: true,
                    },
                }),

                // Recent Appointments (latest 5)
                prisma.appointment.findMany({
                    where: { clinicId, deletedAt: null },
                    include: {
                        pet: {
                            select: { id: true, name: true },
                        },
                        customer: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                        vet: {
                            select: { id: true, firstName: true, lastName: true, username: true },
                        },
                    },
                    orderBy: { appointmentDate: 'desc' },
                    take: 5,
                }),

                // Recent Transactions (latest 5)
                prisma.transaction.findMany({
                    where: { clinicId, deletedAt: null },
                    orderBy: { date: 'desc' },
                    take: 5,
                }),

                // Upcoming Appointments (next 7 days)
                prisma.appointment.findMany({
                    where: {
                        clinicId,
                        deletedAt: null,
                        appointmentDate: {
                            gte: today,
                            lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
                        },
                    },
                    include: {
                        pet: {
                            select: { id: true, name: true },
                        },
                        customer: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                        vet: {
                            select: { id: true, firstName: true, lastName: true },
                        },
                    },
                    orderBy: { appointmentDate: 'asc' },
                    take: 10,
                }),
            ]);

            // Handle low stock supplies - filter based on quantity vs reorderLevel
            const lowStockCount = lowStockSupplies.filter((supply) => {
                const reorderLevel = supply.reorderLevel || 10;
                return supply.quantity <= reorderLevel;
            }).length;

            return {
                totalPets,
                totalCustomers,
                totalStaff,
                totalAppointments,
                todayAppointments,
                pendingAppointments,
                completedAppointments,
                totalGroomings,
                totalPharmacyRecords,
                totalSupplies,
                lowStockSupplies: lowStockCount,
                monthlyRevenue: monthlyRevenueData._sum.amount || 0,
                recentAppointments: this._formatAppointments(recentAppointments),
                recentTransactions: recentTransactions.map((t) => ({
                    ...t,
                    amount: parseFloat(t.amount) || 0,
                })),
                upcomingAppointments: this._formatAppointments(upcomingAppointments),
            };
        } catch (error) {
            logger.error('Error in getDashboardData:', error);
            throw new AppError(
                'Failed to fetch dashboard data',
                HTTP_STATUS.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Format appointments data
     */
    static _formatAppointments(appointments) {
        return appointments.map((apt) => ({
            id: apt.id,
            petName: apt.pet?.name || 'Unknown',
            customerName: apt.customer
                ? `${apt.customer.firstName} ${apt.customer.lastName}`
                : 'Unknown',
            vetName: apt.vet
                ? `${apt.vet.firstName} ${apt.vet.lastName}`
                : 'Unknown',
            appointmentDate: apt.appointmentDate,
            status: apt.status,
        }));
    }
}

module.exports = DashboardService;
