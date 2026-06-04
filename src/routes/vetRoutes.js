const express = require("express");
const router = express.Router({ mergeParams: true });
const VetController = require("../controllers/VetController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const clinicAccessMiddleware = require("../middleware/clinicAccessMiddleware");

/**
 * Vet Routes
 * Base: /api/v1/clinics/:clinicId/vet
 * Role: VET
 */

// All routes require authentication and VET role
router.use(authMiddleware);
router.use(roleMiddleware(["VET", "ADMIN", "SUPERADMIN"]));
router.use(clinicAccessMiddleware);

// ============================================================
// DASHBOARD
// ============================================================

// GET /api/v1/clinics/:clinicId/vet/dashboard/stats
router.get("/dashboard/stats", VetController.getDashboardStats);

// GET /api/v1/clinics/:clinicId/vet/pets
router.get("/pets", VetController.getAssignedPets);

// GET /api/v1/clinics/:clinicId/vet/inpatient-pets
router.get("/inpatient-pets", VetController.getInpatientPets);

// PUT /api/v1/clinics/:clinicId/vet/pets/:petId/admission
router.put("/pets/:petId/admission", VetController.admitPet);

// GET /api/v1/clinics/:clinicId/vet/appointments/today
router.get("/appointments/today", VetController.getTodayAppointments);

// GET /api/v1/clinics/:clinicId/vet/appointments
router.get("/appointments", VetController.getAppointments);

// ============================================================
// CASE MANAGEMENT
// ============================================================

// GET /api/v1/clinics/:clinicId/vet/cases
router.get("/cases", VetController.getCases);

// GET /api/v1/clinics/:clinicId/vet/cases/:caseId
router.get("/cases/:caseId", VetController.getCaseById);

// POST /api/v1/clinics/:clinicId/vet/cases
router.post("/cases", VetController.createCase);

// GET /api/v1/clinics/:clinicId/vet/pets/:petId/cases
router.get("/pets/:petId/cases", VetController.getCasesByPet);

// PUT /api/v1/clinics/:clinicId/vet/cases/:caseId/status
router.put("/cases/:caseId/status", VetController.updateCaseStatus);

// GET /api/v1/clinics/:clinicId/vet/cases/:caseId/history
router.get("/cases/:caseId/history", VetController.getCaseHistory);

// ============================================================
// SYMPTOMS
// ============================================================

// POST /api/v1/clinics/:clinicId/vet/cases/:caseId/symptoms
router.post("/cases/:caseId/symptoms", VetController.addSymptoms);

// PUT /api/v1/clinics/:clinicId/vet/cases/:caseId/symptoms/:symptomId
router.put("/cases/:caseId/symptoms/:symptomId", VetController.updateSymptoms);

// ============================================================
// IMAGING
// ============================================================

// POST /api/v1/clinics/:clinicId/vet/cases/:caseId/imaging
router.post("/cases/:caseId/imaging", VetController.addImaging);

// PUT /api/v1/clinics/:clinicId/vet/cases/:caseId/imaging/:imagingId
router.put("/cases/:caseId/imaging/:imagingId", VetController.updateImaging);

// GET /api/v1/clinics/:clinicId/vet/imaging
router.get("/imaging", VetController.getImaging);

// PUT /api/v1/clinics/:clinicId/vet/imaging/:imagingId (direct update)
router.put("/imaging/:imagingId", VetController.updateImagingDirect);

// DELETE /api/v1/clinics/:clinicId/vet/imaging/:imagingId
router.delete("/imaging/:imagingId", VetController.deleteImaging);

// ============================================================
// PROCEDURES
// ============================================================

// POST /api/v1/clinics/:clinicId/vet/cases/:caseId/procedures
router.post("/cases/:caseId/procedures", VetController.addProcedure);

// ============================================================
// VACCINATIONS
// ============================================================

// POST /api/v1/clinics/:clinicId/vet/cases/:caseId/vaccinations
router.post("/cases/:caseId/vaccinations", VetController.addVaccination);

// ============================================================
// DIAGNOSIS & PRESCRIPTIONS
// ============================================================

// POST /api/v1/clinics/:clinicId/vet/cases/:caseId/diagnoses
router.post("/cases/:caseId/diagnoses", VetController.addDiagnosis);

module.exports = router;
