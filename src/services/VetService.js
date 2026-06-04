const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
const prisma = new PrismaClient();

class VetService {
  // ============================================================
  // VET DASHBOARD METHODS
  // ============================================================

  // Get vet's currently assigned pets.
  async getAssignedPets(vetId, clinicId, search) {
    const searchQuery = search && search.trim() ? search.trim() : null;
    logger.info(`[getAssignedPets] Fetching for vetId: ${vetId}, clinicId: ${clinicId}, search: ${searchQuery}`);

    const assignmentFilter = {
      assignedVetId: vetId,
    };

    logger.info(`[getAssignedPets] Query filter: clinicId=${clinicId}, status != ADMITTED, no ACTIVE vet cases, assignedVetId=${vetId}`);

    // First, let's see what pets match the assignment filter
    const allAssignedPets = await prisma.pet.findMany({
      where: {
        clinicId,
        deletedAt: null,
        AND: [assignmentFilter],
      },
      select: { id: true, name: true, assignedVetId: true, status: true },
    });

    logger.info(`[getAssignedPets] Pets assigned to this vet (before filtering): ${allAssignedPets.length}`,
      allAssignedPets.map(p => ({ id: p.id, name: p.name, status: p.status, assignedVetId: p.assignedVetId })));

    const pets = await prisma.pet.findMany({
      where: {
        clinicId,
        deletedAt: null,
        status: { not: "ADMITTED" },
        vetCases: {
          none: {
            deletedAt: null,
            status: "ACTIVE",
          },
        },
        AND: [
          assignmentFilter,
          ...(searchQuery ? [{
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { petId: { contains: searchQuery, mode: "insensitive" } },
              {
                owner: {
                  firstName: { contains: searchQuery, mode: "insensitive" },
                },
              },
              {
                owner: {
                  lastName: { contains: searchQuery, mode: "insensitive" },
                },
              },
            ],
          }] : []),
        ],
      },
      include: {
        owner: true,
        appointments: {
          where: { vetId, deletedAt: null },
          take: 5,
          orderBy: { appointmentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info(`[getAssignedPets] Found ${pets.length} assigned pets for vet ${vetId}`);

    if (pets.length > 0) {
      logger.info(`[getAssignedPets] Pets:`, pets.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        assignedVetId: p.assignedVetId,
        ownerName: `${p.owner?.firstName || ''} ${p.owner?.lastName || ''}`.trim(),
        hasActiveCases: false // This is filtered by the query
      })));
    } else {
      logger.info(`[getAssignedPets] No pets found. Expected pets currently assigned to vetId=${vetId} and no active cases`);
    }
    return pets;
  }

  // Get all assigned pets in clinic (for ADMIN/SUPERADMIN users)
  async getAllAssignedPetsInClinic(clinicId, search) {
    const searchQuery = search && search.trim() ? search.trim() : null;
    logger.info(`[getAllAssignedPetsInClinic] Fetching for clinicId: ${clinicId}, search: ${searchQuery}`);

    const pets = await prisma.pet.findMany({
      where: {
        clinicId,
        deletedAt: null,
        assignedVetId: { not: null }, // Only pets with assigned vets
        status: { not: "ADMITTED" },
        vetCases: {
          none: {
            deletedAt: null,
            status: "ACTIVE",
          },
        },
        ...(searchQuery ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { petId: { contains: searchQuery, mode: "insensitive" } },
            {
              owner: {
                firstName: { contains: searchQuery, mode: "insensitive" },
              },
            },
            {
              owner: {
                lastName: { contains: searchQuery, mode: "insensitive" },
              },
            },
          ],
        } : {}),
      },
      include: {
        owner: true,
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointments: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { appointmentDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info(`[getAllAssignedPetsInClinic] Found ${pets.length} assigned pets in clinic`);
    return pets;
  }

  // Get inpatient pets for the clinic
  async getInpatientPets(clinicId) {
    const pets = await prisma.pet.findMany({
      where: {
        clinicId,
        deletedAt: null,
        status: "ADMITTED",
      },
      include: {
        owner: true,
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { admissionDate: "desc" },
    });
    return pets;
  }

  // Admit a pet as inpatient
  async admitPet(clinicId, petId, admissionDate = null) {
    const pet = await prisma.pet.findFirst({
      where: {
        clinicId,
        deletedAt: null,
        OR: [
          { id: petId },
          { petId },
        ],
      },
    });

    if (!pet) {
      return null;
    }

    return prisma.pet.update({
      where: { id: pet.id },
      data: {
        status: "ADMITTED",
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      },
      include: {
        owner: true,
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Get today's appointments for vet
  async getTodayAppointments(vetId, clinicId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        vetId,
        clinicId,
        deletedAt: null,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        pet: {
          include: { owner: true },
        },
        customer: true,
      },
      orderBy: { appointmentDate: "asc" },
    });
    return appointments;
  }

  // Get all appointments for vet with filters
  async getVetAppointments(vetId, clinicId, status = null, search = "") {
    const where = {
      vetId,
      clinicId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { pet: { name: { contains: search, mode: "insensitive" } } },
        { pet: { petId: { contains: search, mode: "insensitive" } } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        pet: {
          include: { owner: true },
        },
        customer: true,
      },
      orderBy: { appointmentDate: "desc" },
    });
    return appointments;
  }

  // ============================================================
  // CASE MANAGEMENT METHODS
  // ============================================================

  // Create new vet case
  async createCase(caseData) {
    // Check if pet already has an active case
    const existingActiveCase = await prisma.vetCase.findFirst({
      where: {
        petId: caseData.petId,
        clinicId: caseData.clinicId,
        status: "ACTIVE",
        deletedAt: null
      }
    });

    if (existingActiveCase) {
      const error = new Error("An active case already exists for this pet");
      error.statusCode = 409;
      throw error;
    }

    const caseNumber = await this.generateCaseNumber(caseData.clinicId);
    const medicalRecordNumber = await this.generateMedicalRecordNumber(caseData.clinicId);

    const vetCase = await prisma.vetCase.create({
      data: {
        clinicId: caseData.clinicId,
        petId: caseData.petId,
        appointmentId: caseData.appointmentId || null,
        vetId: caseData.vetId,
        caseNumber,
        medicalRecordNumber,
        status: "ACTIVE",
        chiefComplaint: caseData.chiefComplaint,
      },
      include: {
        pet: { include: { owner: true } },
        vet: true,
      },
    });
    return vetCase;
  }

  // Get case by ID
  async getCaseById(caseId, clinicId) {
    const vetCase = await prisma.vetCase.findFirst({
      where: { id: caseId, clinicId, deletedAt: null },
      include: {
        pet: { include: { owner: true } },
        vet: { select: { id: true, firstName: true, lastName: true, email: true } },
        appointment: true,
        symptoms: { orderBy: { recordedAt: "desc" } },
        imaging: { orderBy: { createdAt: "desc" } },
        procedures: {
          include: {
            parentProcedure: {
              select: {
                id: true,
                procedureName: true,
                procedureDate: true,
              },
            },
          },
          orderBy: { procedureDate: "desc" },
        },
        vaccinations: { orderBy: { administeredDate: "desc" } },
        diagnoses: {
          include: { medications: true },
          orderBy: { diagnosedAt: "desc" },
        },
      },
    });
    return vetCase;
  }

  // Get all cases for a pet
  async getCasesByPet(petId, clinicId) {
    const cases = await prisma.vetCase.findMany({
      where: { petId, clinicId, deletedAt: null },
      include: {
        vet: { select: { id: true, firstName: true, lastName: true } },
        symptoms: { orderBy: { recordedAt: "desc" }, take: 1 },
        diagnoses: true,
      },
      orderBy: { caseDate: "desc" },
    });
    return cases;
  }

  // Get all cases for vet
  async getVetCases(vetId, clinicId, status = null) {
    const where = {
      vetId,
      clinicId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const cases = await prisma.vetCase.findMany({
      where,
      include: {
        pet: { include: { owner: true } },
        _count: {
          select: {
            symptoms: true,
            imaging: true,
            procedures: true,
            diagnoses: true,
          },
        },
      },
      orderBy: { caseDate: "desc" },
    });
    return cases;
  }

  // Get all cases in a clinic (for SUPERADMIN)
  async getAllCasesInClinic(clinicId, status = null) {
    const where = {
      clinicId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const cases = await prisma.vetCase.findMany({
      where,
      include: {
        pet: { include: { owner: true } },
        vet: { select: { id: true, firstName: true, lastName: true } },
        _count: {
          select: {
            symptoms: true,
            imaging: true,
            procedures: true,
            diagnoses: true,
          },
        },
      },
      orderBy: { caseDate: "desc" },
    });
    return cases;
  }

  // Update case status
  async updateCaseStatus(caseId, clinicId, status) {
    const existingCase = await prisma.vetCase.findFirst({
      where: { id: caseId, clinicId, deletedAt: null },
      select: { id: true, petId: true },
    });

    if (!existingCase) {
      return null;
    }

    const updateData = { status };
    if (status === "CLOSED") {
      updateData.closedAt = new Date();
    }

    const vetCase = await prisma.$transaction(async (tx) => {
      const updatedCase = await tx.vetCase.update({
        where: { id: existingCase.id },
        data: updateData,
      });

      if (status === "CLOSED") {
        await tx.pet.update({
          where: { id: existingCase.petId },
          data: {
            status: "DISCHARGED",
            dischargeDate: new Date(),
            assignedVetId: null,
          },
        });
      }

      return updatedCase;
    });

    return vetCase;
  }

  // ============================================================
  // SYMPTOMS METHODS
  // ============================================================

  // Add symptoms record
  async addSymptoms(vetCaseId, symptomData) {
    const symptom = await prisma.symptomRecord.create({
      data: {
        vetCaseId,
        chiefComplaint: symptomData.chiefComplaint,
        symptomsObserved: symptomData.symptomsObserved,
        clinicalNotes: symptomData.clinicalNotes,
        temperature: symptomData.temperature ? parseFloat(symptomData.temperature) : null,
        heartRate: symptomData.heartRate ? parseInt(symptomData.heartRate) : null,
        weight: symptomData.weight ? parseFloat(symptomData.weight) : null,
        appetiteStatus: symptomData.appetiteStatus,
        recordedAt: new Date(),
        recordedBy: symptomData.recordedBy,
      },
    });
    return symptom;
  }

  // Update symptoms
  async updateSymptoms(symptomId, vetCaseId, symptomData) {
    const symptom = await prisma.symptomRecord.updateMany({
      where: { id: symptomId, vetCaseId },
      data: {
        chiefComplaint: symptomData.chiefComplaint,
        symptomsObserved: symptomData.symptomsObserved,
        clinicalNotes: symptomData.clinicalNotes,
        temperature: symptomData.temperature ? parseFloat(symptomData.temperature) : null,
        heartRate: symptomData.heartRate ? parseInt(symptomData.heartRate) : null,
        weight: symptomData.weight ? parseFloat(symptomData.weight) : null,
        appetiteStatus: symptomData.appetiteStatus,
        updatedAt: new Date(),
      },
    });
    return symptom;
  }

  // ============================================================
  // IMAGING METHODS
  // ============================================================

  // Add imaging record
  async addImaging(vetCaseId, imagingData) {
    const imaging = await prisma.imagingRecord.create({
      data: {
        vetCaseId,
        imagingType: imagingData.imagingType,
        instructions: imagingData.instructions,
        status: "PENDING",
        scheduledDate: imagingData.scheduledDate
          ? new Date(imagingData.scheduledDate)
          : null,
        cost: imagingData.cost ? parseFloat(imagingData.cost) : null,
        notes: imagingData.notes,
      },
    });
    return imaging;
  }

  // Update imaging status
  async updateImagingStatus(imagingId, vetCaseId, status, findings = null, reportUrl = null) {
    const updateData = { status, updatedAt: new Date() };
    if (findings) updateData.findings = findings;
    if (reportUrl) updateData.reportUrl = reportUrl;
    if (status === "COMPLETED") {
      updateData.completedDate = new Date();
    }

    await prisma.imagingRecord.updateMany({
      where: { id: imagingId, vetCaseId },
      data: updateData,
    });

    // Fetch and return the updated record
    const imaging = await prisma.imagingRecord.findUnique({
      where: { id: imagingId },
      include: {
        vetCase: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    customerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (imaging) {
      const owner = imaging.vetCase?.pet?.owner;
      return {
        ...imaging,
        _id: imaging.id,
        petId: imaging.vetCase?.pet?.id,
        petName: imaging.vetCase?.pet?.name || "",
        caseId: imaging.vetCase?.id,
        customerCode: owner?.code || owner?.customerId || null,
        customerName: owner
          ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
          : null,
      };
    }
    return imaging;
  }

  // Get all imaging records for a clinic
  async getImagingRecordsByClinic(clinicId) {
    const imagingRecords = await prisma.imagingRecord.findMany({
      where: {
        vetCase: {
          clinicId: clinicId,
        },
      },
      include: {
        vetCase: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    customerId: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include pet and owner info at top level, and map id to _id
    return imagingRecords.map((imaging) => {
      const owner = imaging.vetCase?.pet?.owner;
      return {
        ...imaging,
        _id: imaging.id,
        petId: imaging.vetCase?.pet?.id,
        petName: imaging.vetCase?.pet?.name || "",
        caseId: imaging.vetCase?.id,
        customerCode: owner?.code || owner?.customerId || null,
        customerName: owner
          ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
          : null,
      };
    });
  }

  // Update imaging record directly (by ID only, without case context)
  async updateImagingRecordDirect(imagingId, updateData) {
    console.log(`[VetService] Updating imaging ${imagingId} with data:`, updateData);

    const dataToUpdate = {};

    if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
    if (updateData.findings !== undefined) dataToUpdate.findings = updateData.findings;
    if (updateData.reportUrl !== undefined) dataToUpdate.reportUrl = updateData.reportUrl;
    if (updateData.imagingType !== undefined) dataToUpdate.imagingType = updateData.imagingType;
    if (updateData.instructions !== undefined) dataToUpdate.instructions = updateData.instructions;
    if (updateData.scheduledDate !== undefined)
      dataToUpdate.scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : null;
    if (updateData.cost !== undefined) dataToUpdate.cost = updateData.cost ? parseFloat(updateData.cost) : null;
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;

    dataToUpdate.updatedAt = new Date();

    console.log(`[VetService] Final data to update:`, dataToUpdate);

    if (updateData.status === "COMPLETED") {
      dataToUpdate.completedDate = new Date();
    }

    await prisma.imagingRecord.update({
      where: { id: imagingId },
      data: dataToUpdate,
    });

    console.log(`[VetService] Imaging ${imagingId} updated successfully`);

    // Fetch and return the updated record
    const imaging = await prisma.imagingRecord.findUnique({
      where: { id: imagingId },
      include: {
        vetCase: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    code: true,
                    customerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (imaging) {
      const owner = imaging.vetCase?.pet?.owner;
      return {
        ...imaging,
        _id: imaging.id,
        petId: imaging.vetCase?.pet?.id,
        petName: imaging.vetCase?.pet?.name || "",
        caseId: imaging.vetCase?.id,
        customerCode: owner?.code || owner?.customerId || null,
        customerName: owner
          ? `${owner.firstName || ""} ${owner.lastName || ""}`.trim()
          : null,
      };
    }
    return imaging;
  }

  // Delete imaging record
  async deleteImagingRecord(imagingId) {
    return await prisma.imagingRecord.delete({
      where: { id: imagingId },
    });
  }

  // ============================================================
  // PROCEDURES METHODS
  // ============================================================

  // Add procedure record
  async addProcedure(vetCaseId, procedureData) {
    const parentProcedureId = procedureData.parentProcedureId || null;

    if (parentProcedureId) {
      const parentProcedure = await prisma.procedureRecord.findFirst({
        where: {
          id: parentProcedureId,
          vetCaseId,
          deletedAt: null,
          parentProcedureId: null,
        },
        select: { id: true },
      });

      if (!parentProcedure) {
        const error = new Error("Main procedure not found for this case");
        error.statusCode = 400;
        throw error;
      }
    }

    const procedure = await prisma.procedureRecord.create({
      data: {
        vetCaseId,
        parentProcedureId,
        procedureName: procedureData.procedureName,
        description: procedureData.description,
        cost: procedureData.cost ? parseFloat(procedureData.cost) : null,
        procedureDate: procedureData.procedureDate
          ? new Date(procedureData.procedureDate)
          : new Date(),
        notes: procedureData.notes,
        performedBy: procedureData.performedBy,
      },
    });
    return procedure;
  }

  // ============================================================
  // VACCINATION METHODS
  // ============================================================

  // Add vaccination record
  async addVaccination(vetCaseId, vaccinationData) {
    const vaccination = await prisma.vaccinationRecord.create({
      data: {
        vetCaseId,
        vaccineName: vaccinationData.vaccineName,
        dueDate: vaccinationData.dueDate ? new Date(vaccinationData.dueDate) : null,
        administeredDate: vaccinationData.administeredDate
          ? new Date(vaccinationData.administeredDate)
          : null,
        nextDueDate: vaccinationData.nextDueDate
          ? new Date(vaccinationData.nextDueDate)
          : null,
        dose: vaccinationData.dose,
        batchNumber: vaccinationData.batchNumber,
        administeredBy: vaccinationData.administeredBy,
        notes: vaccinationData.notes,
      },
    });
    return vaccination;
  }

  // ============================================================
  // DIAGNOSIS & PRESCRIPTION METHODS
  // ============================================================

  // Add diagnosis with medications
  async addDiagnosis(vetCaseId, diagnosisData) {
    const diagnosis = await prisma.caseDiagnosis.create({
      data: {
        vetCaseId,
        diagnosis: diagnosisData.diagnosis,
        treatmentPlan: diagnosisData.treatmentPlan || null,
        dischargeNote: diagnosisData.dischargeNote || null,
        physicianNote: diagnosisData.physicianNote || null,
        notes: diagnosisData.notes || null,
        followUpDate: diagnosisData.followUpDate ? new Date(diagnosisData.followUpDate) : null,
        followUpTimeSlot: diagnosisData.followUpTimeSlot || null,
        remarks: diagnosisData.remarks || null,
        medications: {
          create: diagnosisData.medications?.map((med) => ({
            medicineName: med.medicineName,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            notes: med.notes,
            cost: med.cost ? parseFloat(med.cost) : null,
          })) || [],
        },
      },
      include: {
        medications: true,
      },
    });
    return diagnosis;
  }

  // ============================================================
  // CASE SHEET / HISTORY
  // ============================================================

  // Get complete case history
  async getCaseHistory(caseId, clinicId) {
    const vetCase = await this.getCaseById(caseId, clinicId);
    if (!vetCase) return null;

    // Build chronological history
    const history = {
      case: vetCase,
      timeline: [],
    };

    // Add symptoms to timeline
    for (const symptom of vetCase.symptoms) {
      history.timeline.push({
        type: "SYMPTOMS",
        date: symptom.recordedAt,
        data: symptom,
      });
    }

    // Add imaging to timeline
    for (const imaging of vetCase.imaging) {
      history.timeline.push({
        type: "IMAGING",
        date: imaging.createdAt,
        data: imaging,
      });
    }

    // Add procedures to timeline
    for (const procedure of vetCase.procedures) {
      history.timeline.push({
        type: "PROCEDURE",
        date: procedure.procedureDate,
        data: procedure,
      });
    }

    // Add diagnoses and medications to timeline
    for (const diagnosis of vetCase.diagnoses) {
      history.timeline.push({
        type: "DIAGNOSIS",
        date: diagnosis.diagnosedAt,
        data: diagnosis,
      });
    }

    // Add vaccinations to timeline
    for (const vaccination of vetCase.vaccinations) {
      history.timeline.push({
        type: "VACCINATION",
        date: vaccination.administeredDate || vaccination.dueDate,
        data: vaccination,
      });
    }

    // Sort timeline by date
    history.timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return history;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  async generateCaseNumber(clinicId) {
    // Find the highest existing caseNumber (including deleted ones) to ensure uniqueness
    const highestCase = await prisma.vetCase.findFirst({
      where: { clinicId },
      orderBy: { caseNumber: "desc" },
      select: { caseNumber: true },
    });

    let nextNumber = 1;
    if (highestCase && highestCase.caseNumber) {
      // Extract the number from CASE-XXXX format
      const match = highestCase.caseNumber.match(/CASE-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Verify the generated case number doesn't already exist (retry if it does)
    let caseNumber = `CASE-${String(nextNumber).padStart(4, "0")}`;
    let attempts = 0;
    const maxAttempts = 100; // Safety limit to prevent infinite loops

    while (attempts < maxAttempts) {
      const existing = await prisma.vetCase.findUnique({
        where: { caseNumber },
        select: { id: true },
      });

      if (!existing) {
        // Case number is available
        return caseNumber;
      }

      // Case number already exists, try next number
      nextNumber++;
      caseNumber = `CASE-${String(nextNumber).padStart(4, "0")}`;
      attempts++;
    }

    throw new Error(`Failed to generate unique case number after ${maxAttempts} attempts`);
  }

  async generateMedicalRecordNumber(clinicId) {
    // Format: MR-YYYY-XXXX where YYYY is current year and XXXX is sequential number
    const currentYear = new Date().getFullYear();

    // Find the highest medical record number for this year and clinic
    const highestRecord = await prisma.vetCase.findFirst({
      where: {
        clinicId,
        medicalRecordNumber: {
          startsWith: `MR-${currentYear}`
        }
      },
      orderBy: { medicalRecordNumber: "desc" },
      select: { medicalRecordNumber: true },
    });

    let nextNumber = 1;
    if (highestRecord && highestRecord.medicalRecordNumber) {
      // Extract the number from MR-YYYY-XXXX format
      const match = highestRecord.medicalRecordNumber.match(/MR-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Verify the generated medical record number doesn't already exist
    let medicalRecordNumber = `MR-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const existing = await prisma.vetCase.findUnique({
        where: { medicalRecordNumber },
        select: { id: true },
      });

      if (!existing) {
        return medicalRecordNumber;
      }

      nextNumber++;
      medicalRecordNumber = `MR-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
      attempts++;
    }

    throw new Error(`Failed to generate unique medical record number after ${maxAttempts} attempts`);
  }

  // Get dashboard stats
  async getDashboardStats(vetId, clinicId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPets,
      todayAppointments,
      activeCases,
      completedCases,
    ] = await Promise.all([
      prisma.pet.count({
        where: {
          clinicId,
          deletedAt: null,
          status: { not: "ADMITTED" },
          vetCases: {
            none: {
              deletedAt: null,
              status: "ACTIVE",
            },
          },
          assignedVetId: vetId,
        },
      }),
      prisma.appointment.count({
        where: {
          vetId,
          clinicId,
          deletedAt: null,
          appointmentDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.vetCase.count({
        where: { vetId, clinicId, status: "ACTIVE", deletedAt: null },
      }),
      prisma.vetCase.count({
        where: { vetId, clinicId, status: "CLOSED", deletedAt: null },
      }),
    ]);

    return {
      totalPets,
      todayAppointments,
      activeCases,
      completedCases,
    };
  }

  // Get all pets in clinic (for SUPERADMIN)
  async getAllPetsInClinic(clinicId, search) {
    console.log("getAllPetsInClinic called with clinicId:", clinicId);
    const searchQuery = search && search.trim() ? search.trim() : null;

    try {
      // Check total pets
      const totalPets = await prisma.pet.count({ where: { clinicId, deletedAt: null } });
      console.log("Total pets in clinic:", totalPets);

      const pets = await prisma.pet.findMany({
        where: {
          clinicId,
          deletedAt: null,
          status: { not: "ADMITTED" },
          vetCases: {
            none: {
              deletedAt: null,
              status: "ACTIVE",
            },
          },
          ...(searchQuery && {
            OR: [
              { name: { contains: searchQuery, mode: "insensitive" } },
              { petId: { contains: searchQuery, mode: "insensitive" } },
              {
                owner: {
                  firstName: { contains: searchQuery, mode: "insensitive" },
                },
              },
              {
                owner: {
                  lastName: { contains: searchQuery, mode: "insensitive" },
                },
              },
            ],
          }),
        },
        include: {
          owner: true,
          assignedVet: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          appointments: {
            take: 5,
            orderBy: { appointmentDate: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return pets;
    } catch (error) {
      console.error("Error in getAllPetsInClinic:", error);
      return [];
    }
  }

  // Get all today's appointments in clinic (for SUPERADMIN)
  async getAllTodayAppointments(clinicId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        deletedAt: null,
        appointmentDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        pet: {
          include: { owner: true },
        },
        customer: true,
      },
      orderBy: { appointmentDate: "asc" },
    });
    return appointments;
  }

  // Get clinic-wide stats (for SUPERADMIN)
  async getClinicStats(clinicId) {
    console.log("getClinicStats called with clinicId:", clinicId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const [
        totalPets,
        todayAppointments,
        activeCases,
        completedCases,
      ] = await Promise.all([
        prisma.pet.count({
          where: {
            clinicId,
            deletedAt: null,
            status: { not: "ADMITTED" },
            vetCases: {
              none: {
                deletedAt: null,
                status: "ACTIVE",
              },
            },
            assignedVetId: { not: null },
          },
        }),
        prisma.appointment.count({
          where: {
            clinicId,
            deletedAt: null,
            appointmentDate: { gte: today, lt: tomorrow },
          },
        }),
        prisma.vetCase.count({
          where: { clinicId, status: "ACTIVE", deletedAt: null },
        }),
        prisma.vetCase.count({
          where: { clinicId, status: "CLOSED", deletedAt: null },
        }),
      ]);

      return {
        totalPets,
        todayAppointments,
        activeCases,
        completedCases,
      };
    } catch (error) {
      console.error("Error in getClinicStats:", error);
      return {
        totalPets: 0,
        todayAppointments: 0,
        activeCases: 0,
        completedCases: 0,
      };
    }
  }
}

module.exports = new VetService();
