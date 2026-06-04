-- Add new fields to vet_cases table
ALTER TABLE "vet_cases" ADD COLUMN "medicalRecordNumber" VARCHAR(50) UNIQUE;

-- Add new fields to symptom_records table
ALTER TABLE "symptom_records" ADD COLUMN "pulse" INTEGER;
ALTER TABLE "symptom_records" ADD COLUMN "diagnosticPlan" TEXT;

-- Add new fields to imaging_records table
ALTER TABLE "imaging_records" ADD COLUMN "bodyPart" VARCHAR(255);
ALTER TABLE "imaging_records" ADD COLUMN "imagingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for medicalRecordNumber
CREATE INDEX "vet_cases_medicalRecordNumber_idx" ON "vet_cases"("medicalRecordNumber");
