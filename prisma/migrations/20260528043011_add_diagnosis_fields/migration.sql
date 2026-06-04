-- AlterTable
ALTER TABLE "case_diagnoses" ADD COLUMN     "dischargeNote" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "followUpTimeSlot" VARCHAR(10),
ADD COLUMN     "physicianNote" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "treatmentPlan" TEXT;
