const express = require("express");
const router = express.Router({ mergeParams: true });
const EventController = require("../controllers/EventController");
const authMiddleware = require("../middleware/authMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

// Routes for events
router.get("/", authMiddleware, clinicAccessMiddleware, EventController.getEventsByClinic);
router.post("/", authMiddleware, clinicAccessMiddleware, EventController.createEvent);
router.put("/:id", authMiddleware, clinicAccessMiddleware, EventController.updateEvent);
router.delete("/:id", authMiddleware, clinicAccessMiddleware, EventController.deleteEvent);

module.exports = router;
