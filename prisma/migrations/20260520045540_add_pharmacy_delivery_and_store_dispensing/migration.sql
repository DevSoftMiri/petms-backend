-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('ACTIVE', 'CLOSED', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "ImagingType" AS ENUM ('XRAY', 'ULTRASOUND', 'MRI', 'CT_SCAN');

-- CreateEnum
CREATE TYPE "ImagingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DispensingType" AS ENUM ('SALE', 'CLINIC_USE');

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "admissionDate" TIMESTAMP(3),
ADD COLUMN     "assignedVetId" TEXT,
ADD COLUMN     "dischargeDate" TIMESTAMP(3),
ADD COLUMN     "status" VARCHAR(20) DEFAULT 'AVAILABLE';

-- CreateTable
CREATE TABLE "vet_cases" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "vetId" TEXT NOT NULL,
    "caseNumber" VARCHAR(50) NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "chiefComplaint" TEXT,
    "caseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vet_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_records" (
    "id" TEXT NOT NULL,
    "vetCaseId" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "symptomsObserved" TEXT,
    "clinicalNotes" TEXT,
    "temperature" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "weight" DOUBLE PRECISION,
    "appetiteStatus" VARCHAR(50),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "symptom_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_records" (
    "id" TEXT NOT NULL,
    "vetCaseId" TEXT NOT NULL,
    "imagingType" "ImagingType" NOT NULL,
    "instructions" TEXT,
    "findings" TEXT,
    "status" "ImagingStatus" NOT NULL DEFAULT 'PENDING',
    "reportUrl" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "imaging_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_records" (
    "id" TEXT NOT NULL,
    "vetCaseId" TEXT NOT NULL,
    "procedureName" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cost" DOUBLE PRECISION,
    "procedureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "procedure_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccination_records" (
    "id" TEXT NOT NULL,
    "vetCaseId" TEXT NOT NULL,
    "vaccineName" VARCHAR(255) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "administeredDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3),
    "batchNumber" VARCHAR(100),
    "administeredBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "vaccination_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_diagnoses" (
    "id" TEXT NOT NULL,
    "vetCaseId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "notes" TEXT,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "case_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "caseDiagnosisId" TEXT NOT NULL,
    "medicineName" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100) NOT NULL,
    "frequency" VARCHAR(100) NOT NULL,
    "duration" VARCHAR(100) NOT NULL,
    "notes" TEXT,
    "cost" DOUBLE PRECISION,
    "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_deliveries" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "supplyId" TEXT,
    "medicineName" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dosage" VARCHAR(100),
    "petId" TEXT,
    "customerId" TEXT,
    "deliveredBy" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pharmacy_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_dispensing" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "storeItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensingType" "DispensingType" NOT NULL,
    "petId" TEXT,
    "customerId" TEXT,
    "dispensedBy" TEXT NOT NULL,
    "dispensingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "store_dispensing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vet_cases_caseNumber_key" ON "vet_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "vet_cases_clinicId_idx" ON "vet_cases"("clinicId");

-- CreateIndex
CREATE INDEX "vet_cases_petId_idx" ON "vet_cases"("petId");

-- CreateIndex
CREATE INDEX "vet_cases_vetId_idx" ON "vet_cases"("vetId");

-- CreateIndex
CREATE INDEX "vet_cases_status_idx" ON "vet_cases"("status");

-- CreateIndex
CREATE INDEX "vet_cases_caseNumber_idx" ON "vet_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "symptom_records_vetCaseId_idx" ON "symptom_records"("vetCaseId");

-- CreateIndex
CREATE INDEX "symptom_records_recordedAt_idx" ON "symptom_records"("recordedAt");

-- CreateIndex
CREATE INDEX "imaging_records_vetCaseId_idx" ON "imaging_records"("vetCaseId");

-- CreateIndex
CREATE INDEX "imaging_records_imagingType_idx" ON "imaging_records"("imagingType");

-- CreateIndex
CREATE INDEX "imaging_records_status_idx" ON "imaging_records"("status");

-- CreateIndex
CREATE INDEX "procedure_records_vetCaseId_idx" ON "procedure_records"("vetCaseId");

-- CreateIndex
CREATE INDEX "procedure_records_procedureDate_idx" ON "procedure_records"("procedureDate");

-- CreateIndex
CREATE INDEX "vaccination_records_vetCaseId_idx" ON "vaccination_records"("vetCaseId");

-- CreateIndex
CREATE INDEX "vaccination_records_vaccineName_idx" ON "vaccination_records"("vaccineName");

-- CreateIndex
CREATE INDEX "case_diagnoses_vetCaseId_idx" ON "case_diagnoses"("vetCaseId");

-- CreateIndex
CREATE INDEX "prescriptions_caseDiagnosisId_idx" ON "prescriptions"("caseDiagnosisId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_clinicId_idx" ON "pharmacy_deliveries"("clinicId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_prescriptionId_idx" ON "pharmacy_deliveries"("prescriptionId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_supplyId_idx" ON "pharmacy_deliveries"("supplyId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_petId_idx" ON "pharmacy_deliveries"("petId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_customerId_idx" ON "pharmacy_deliveries"("customerId");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_deliveredBy_idx" ON "pharmacy_deliveries"("deliveredBy");

-- CreateIndex
CREATE INDEX "pharmacy_deliveries_deliveryDate_idx" ON "pharmacy_deliveries"("deliveryDate");

-- CreateIndex
CREATE INDEX "store_dispensing_clinicId_idx" ON "store_dispensing"("clinicId");

-- CreateIndex
CREATE INDEX "store_dispensing_storeItemId_idx" ON "store_dispensing"("storeItemId");

-- CreateIndex
CREATE INDEX "store_dispensing_petId_idx" ON "store_dispensing"("petId");

-- CreateIndex
CREATE INDEX "store_dispensing_customerId_idx" ON "store_dispensing"("customerId");

-- CreateIndex
CREATE INDEX "store_dispensing_dispensedBy_idx" ON "store_dispensing"("dispensedBy");

-- CreateIndex
CREATE INDEX "store_dispensing_dispensingType_idx" ON "store_dispensing"("dispensingType");

-- CreateIndex
CREATE INDEX "store_dispensing_dispensingDate_idx" ON "store_dispensing"("dispensingDate");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_assignedVetId_fkey" FOREIGN KEY ("assignedVetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_cases" ADD CONSTRAINT "vet_cases_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_cases" ADD CONSTRAINT "vet_cases_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_cases" ADD CONSTRAINT "vet_cases_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_cases" ADD CONSTRAINT "vet_cases_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_records" ADD CONSTRAINT "symptom_records_vetCaseId_fkey" FOREIGN KEY ("vetCaseId") REFERENCES "vet_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_records" ADD CONSTRAINT "imaging_records_vetCaseId_fkey" FOREIGN KEY ("vetCaseId") REFERENCES "vet_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_records" ADD CONSTRAINT "procedure_records_vetCaseId_fkey" FOREIGN KEY ("vetCaseId") REFERENCES "vet_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccination_records" ADD CONSTRAINT "vaccination_records_vetCaseId_fkey" FOREIGN KEY ("vetCaseId") REFERENCES "vet_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_diagnoses" ADD CONSTRAINT "case_diagnoses_vetCaseId_fkey" FOREIGN KEY ("vetCaseId") REFERENCES "vet_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_caseDiagnosisId_fkey" FOREIGN KEY ("caseDiagnosisId") REFERENCES "case_diagnoses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "supplies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_deliveredBy_fkey" FOREIGN KEY ("deliveredBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_dispensing" ADD CONSTRAINT "store_dispensing_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_dispensing" ADD CONSTRAINT "store_dispensing_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_dispensing" ADD CONSTRAINT "store_dispensing_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_dispensing" ADD CONSTRAINT "store_dispensing_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_dispensing" ADD CONSTRAINT "store_dispensing_dispensedBy_fkey" FOREIGN KEY ("dispensedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
