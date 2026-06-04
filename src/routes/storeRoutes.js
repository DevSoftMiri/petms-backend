const express = require("express");
const router = express.Router({ mergeParams: true });
const StoreItemController = require("../controllers/StoreItemController");
const authMiddleware = require("../middleware/authMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

// Routes for store items
router.get("/", authMiddleware, clinicAccessMiddleware, StoreItemController.getStoreItemsByClinic);
router.post("/", authMiddleware, clinicAccessMiddleware, StoreItemController.createStoreItem);
router.put("/:id/quantity", authMiddleware, clinicAccessMiddleware, StoreItemController.updateQuantity);
router.put("/:id", authMiddleware, clinicAccessMiddleware, StoreItemController.updateStoreItem);
router.delete("/:id", authMiddleware, clinicAccessMiddleware, StoreItemController.deleteStoreItem);

module.exports = router;
