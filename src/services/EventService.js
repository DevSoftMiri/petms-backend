const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class EventService {
    async getEventsByClinic(clinicId) {
        const events = await prisma.event.findMany({
            where: { clinicId, deletedAt: null },
            orderBy: { date: "desc" },
        });
        return events;
    }

    async createEvent(eventData) {
        const event = await prisma.event.create({
            data: {
                clinicId: eventData.clinicId,
                title: eventData.title,
                description: eventData.description,
                type: eventData.type,
                date: new Date(eventData.date),
                time: eventData.time,
                location: eventData.location,
                attendees: eventData.attendees || 0,
                status: eventData.status || "Confirmed",
            },
        });
        return event;
    }

    async updateEvent(id, clinicId, eventData) {
        const event = await prisma.event.updateMany({
            where: { id, clinicId },
            data: {
                title: eventData.title,
                description: eventData.description,
                type: eventData.type,
                date: eventData.date ? new Date(eventData.date) : undefined,
                time: eventData.time,
                location: eventData.location,
                attendees: eventData.attendees,
                status: eventData.status,
                updatedAt: new Date(),
            },
        });
        return event;
    }

    async deleteEvent(id, clinicId) {
        await prisma.event.updateMany({
            where: { id, clinicId },
            data: { deletedAt: new Date() },
        });
    }
}

module.exports = new EventService();
