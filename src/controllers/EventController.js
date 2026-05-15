const EventService = require("../services/EventService");
const { errorResponse, successResponse } = require("../utils/response");

class EventController {
    async getEventsByClinic(req, res) {
        try {
            const { clinicId } = req.params;
            const events = await EventService.getEventsByClinic(clinicId);
            return res.json(events);
        } catch (error) {
            console.error("Error fetching events:", error);
            return errorResponse(res, 500, "Failed to fetch events", error);
        }
    }

    async createEvent(req, res) {
        try {
            const { clinicId } = req.params;
            const eventData = { ...req.body, clinicId };
            const event = await EventService.createEvent(eventData);
            return successResponse(res, 201, "Event created successfully", event);
        } catch (error) {
            console.error("Error creating event:", error);
            return errorResponse(res, 500, "Failed to create event", error);
        }
    }

    async updateEvent(req, res) {
        try {
            const { clinicId, id } = req.params;
            const event = await EventService.updateEvent(id, clinicId, req.body);
            return successResponse(res, 200, "Event updated successfully", event);
        } catch (error) {
            console.error("Error updating event:", error);
            return errorResponse(res, 500, "Failed to update event", error);
        }
    }

    async deleteEvent(req, res) {
        try {
            const { clinicId, id } = req.params;
            await EventService.deleteEvent(id, clinicId);
            return successResponse(res, 200, "Event deleted successfully");
        } catch (error) {
            console.error("Error deleting event:", error);
            return errorResponse(res, 500, "Failed to delete event", error);
        }
    }
}

module.exports = new EventController();
