const express = require("express");
const router = express.Router({ mergeParams: true });
const TransactionController = require("../controllers/TransactionController");
const authMiddleware = require("../middleware/authMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

// Routes for finance/transactions
router.get("/", authMiddleware, clinicAccessMiddleware, TransactionController.getTransactionsByClinic);
router.post("/", authMiddleware, clinicAccessMiddleware, TransactionController.createTransaction);
router.put("/:id", authMiddleware, clinicAccessMiddleware, TransactionController.updateTransaction);
router.delete("/:id", authMiddleware, clinicAccessMiddleware, TransactionController.deleteTransaction);

module.exports = router;
