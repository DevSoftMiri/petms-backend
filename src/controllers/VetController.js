const VetService = require("../services/VetService");
const apiResponse = require("../utils/response");
const { HTTP_STATUS } = require("../utils/constants");

/**
 * Vet Controller
 * Handles all vet dashboard and case management operations
 */
class VetController {
  // ============================================================
  // DASHBOARD METHODS
  // ============================================================

  // Get dashboard stats
  static getDashboardStats = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      let stats;
      if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
        stats = await VetService.getClinicStats(clinicId);
      } else {
        stats = await VetService.getDashboardStats(userId, clinicId);
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: stats, message: "Dashboard stats retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get assigned pets
  static getAssignedPets = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { search } = req.query;

      console.log("getAssignedPets - userRole:", userRole, "clinicId:", clinicId, "userId:", userId);

      let pets;
      if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
        // Admins see pets that are currently assigned to a vet.
        console.log("Calling getAllAssignedPetsInClinic for", userRole);
        pets = await VetService.getAllAssignedPetsInClinic(clinicId, search);
      } else {
        // Vets see only their own assigned pets
        console.log("Calling getAssignedPets for vet:", userId);
        pets = await VetService.getAssignedPets(userId, clinicId, search);
      }

      console.log("Pets found:", pets.length);

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: pets, message: "Assigned pets retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get inpatient pets
  static getInpatientPets = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const userRole = req.user.role;

      let pets;
      if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
        pets = await VetService.getInpatientPets(clinicId);
      } else {
        pets = await VetService.getInpatientPets(clinicId);
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: pets, message: "Inpatient pets retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Admit pet as inpatient
  static admitPet = async (req, res, next) => {
    try {
      const { clinicId, petId } = req.params;
      const { admissionDate } = req.body;

      const pet = await VetService.admitPet(clinicId, petId, admissionDate);

      if (!pet) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          apiResponse.error("Pet not found", HTTP_STATUS.NOT_FOUND)
        );
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: pet, message: "Pet admitted successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get today's appointments
  static getTodayAppointments = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      let appointments;
      if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
        appointments = await VetService.getAllTodayAppointments(clinicId);
      } else {
        appointments = await VetService.getTodayAppointments(userId, clinicId);
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: appointments, message: "Today's appointments retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get vet appointments with filters
  static getAppointments = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const vetId = req.user.id;
      const { status, search } = req.query;

      const appointments = await VetService.getVetAppointments(
        vetId,
        clinicId,
        status,
        search
      );

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: appointments, message: "Appointments retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // CASE MANAGEMENT
  // ============================================================

  // Create new case
  static createCase = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const vetId = req.user.id;
      const caseData = {
        ...req.body,
        clinicId,
        vetId,
      };

      const vetCase = await VetService.createCase(caseData);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: vetCase, message: "Case created successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get case by ID
  static getCaseById = async (req, res, next) => {
    try {
      const { clinicId, caseId } = req.params;

      const vetCase = await VetService.getCaseById(caseId, clinicId);

      if (!vetCase) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          apiResponse.error("Case not found", HTTP_STATUS.NOT_FOUND)
        );
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: vetCase, message: "Case retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get all cases for vet
  static getCases = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const { status } = req.query;
      const userRole = req.user.role;
      const userId = req.user.id;

      let cases;
      if (userRole === "SUPERADMIN" || userRole === "ADMIN") {
        // Admin and Super admin see all cases in clinic
        cases = await VetService.getAllCasesInClinic(clinicId, status);
      } else {
        // Regular vets see only their assigned cases
        cases = await VetService.getVetCases(userId, clinicId, status);
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: cases, message: "Cases retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get cases by pet
  static getCasesByPet = async (req, res, next) => {
    try {
      const { clinicId, petId } = req.params;

      const cases = await VetService.getCasesByPet(petId, clinicId);

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: cases, message: "Pet cases retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Update case status
  static updateCaseStatus = async (req, res, next) => {
    try {
      const { clinicId, caseId } = req.params;
      const { status } = req.body;

      const vetCase = await VetService.updateCaseStatus(caseId, clinicId, status);

      if (!vetCase) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          apiResponse.error("Case not found", HTTP_STATUS.NOT_FOUND)
        );
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: vetCase, message: "Case status updated successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // SYMPTOMS
  // ============================================================

  // Add symptoms
  static addSymptoms = async (req, res, next) => {
    try {
      const { clinicId, caseId } = req.params;

      const symptom = await VetService.addSymptoms(caseId, req.body);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: symptom, message: "Symptoms recorded successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Update symptoms
  static updateSymptoms = async (req, res, next) => {
    try {
      const { caseId, symptomId } = req.params;

      await VetService.updateSymptoms(symptomId, caseId, req.body);

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: null, message: "Symptoms updated successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // IMAGING
  // ============================================================

  // Add imaging
  static addImaging = async (req, res, next) => {
    try {
      const { caseId } = req.params;

      const imaging = await VetService.addImaging(caseId, req.body);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: imaging, message: "Imaging request added successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Update imaging status
  static updateImaging = async (req, res, next) => {
    try {
      const { caseId, imagingId } = req.params;
      const { status, findings, reportUrl } = req.body;

      const updatedImaging = await VetService.updateImagingStatus(imagingId, caseId, status, findings, reportUrl);

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: updatedImaging, message: "Imaging updated successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Get all imaging records for clinic
  static getImaging = async (req, res, next) => {
    try {
      const { clinicId } = req.params;
      const imagingRecords = await VetService.getImagingRecordsByClinic(clinicId);
      res.status(HTTP_STATUS.OK).json(imagingRecords);
    } catch (error) {
      next(error);
    }
  };

  // Update imaging record directly (by imaging ID only)
  static updateImagingDirect = async (req, res, next) => {
    try {
      const { imagingId } = req.params;
      const { status, findings, reportUrl, imagingType, instructions, scheduledDate, cost, notes } = req.body;

      const updatedImaging = await VetService.updateImagingRecordDirect(
        imagingId,
        { status, findings, reportUrl, imagingType, instructions, scheduledDate, cost, notes }
      );

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: updatedImaging, message: "Imaging updated successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // Delete imaging record
  static deleteImaging = async (req, res, next) => {
    try {
      const { imagingId } = req.params;

      await VetService.deleteImagingRecord(imagingId);

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: null, message: "Imaging record deleted successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // PROCEDURES
  // ============================================================

  // Add procedure
  static addProcedure = async (req, res, next) => {
    try {
      const { caseId } = req.params;

      const procedure = await VetService.addProcedure(caseId, req.body);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: procedure, message: "Procedure added successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // VACCINATIONS
  // ============================================================

  // Add vaccination
  static addVaccination = async (req, res, next) => {
    try {
      const { caseId } = req.params;

      const vaccination = await VetService.addVaccination(caseId, req.body);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: vaccination, message: "Vaccination added successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // DIAGNOSIS & PRESCRIPTIONS
  // ============================================================

  // Add diagnosis
  static addDiagnosis = async (req, res, next) => {
    try {
      const { caseId } = req.params;

      const diagnosis = await VetService.addDiagnosis(caseId, req.body);

      res.status(HTTP_STATUS.CREATED).json(
        apiResponse.success({ data: diagnosis, message: "Diagnosis added successfully" })
      );
    } catch (error) {
      next(error);
    }
  };

  // ============================================================
  // CASE HISTORY
  // ============================================================

  // Get case history
  static getCaseHistory = async (req, res, next) => {
    try {
      const { clinicId, caseId } = req.params;

      const history = await VetService.getCaseHistory(caseId, clinicId);

      if (!history) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          apiResponse.error("Case not found", HTTP_STATUS.NOT_FOUND)
        );
      }

      res.status(HTTP_STATUS.OK).json(
        apiResponse.success({ data: history, message: "Case history retrieved successfully" })
      );
    } catch (error) {
      next(error);
    }
  };
}

module.exports = VetController;
