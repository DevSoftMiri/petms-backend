const express = require("express");
const router = express.Router();
const SuperAdminFundsController = require("../controllers/SuperAdminFundsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, roleMiddleware(["SUPERADMIN"]), SuperAdminFundsController.getFunds);
router.post("/", authMiddleware, roleMiddleware(["SUPERADMIN"]), SuperAdminFundsController.createFund);

module.exports = router;
