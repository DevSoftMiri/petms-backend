const express = require("express");
const router = express.Router({ mergeParams: true });
const LabTestController = require("../controllers/LabTestController");
const authMiddleware = require("../middleware/authMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

// Routes for laboratory tests
router.get("/", authMiddleware, clinicAccessMiddleware, LabTestController.getLabTestsByClinic);
router.post("/", authMiddleware, clinicAccessMiddleware, LabTestController.createLabTest);
router.put("/:id", authMiddleware, clinicAccessMiddleware, LabTestController.updateLabTest);
router.delete("/:id", authMiddleware, clinicAccessMiddleware, LabTestController.deleteLabTest);

module.exports = router;
