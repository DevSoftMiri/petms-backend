const express = require("express");
const router = express.Router({ mergeParams: true });
const SupplyController = require("../controllers/SupplyController");
const authMiddleware = require("../middleware/authMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

// Routes for supplies
router.get("/", authMiddleware, clinicAccessMiddleware, SupplyController.getSuppliesByClinic);
router.post("/", authMiddleware, clinicAccessMiddleware, SupplyController.createSupply);
router.put("/:id", authMiddleware, clinicAccessMiddleware, SupplyController.updateSupply);
router.delete("/:id", authMiddleware, clinicAccessMiddleware, SupplyController.deleteSupply);

module.exports = router;
