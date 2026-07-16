ALTER TABLE "grooming_records"
  ALTER COLUMN "groomerId" DROP NOT NULL,
  ADD COLUMN "externalGroomerId" TEXT;

CREATE TABLE "external_groomers" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "phoneNumber" VARCHAR(20),
  "email" VARCHAR(255),
  "location" VARCHAR(255),
  "address" TEXT,
  "specialization" VARCHAR(255),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "external_groomers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "external_groomers_clinicId_idx" ON "external_groomers"("clinicId");
CREATE INDEX "external_groomers_name_idx" ON "external_groomers"("name");
CREATE INDEX "external_groomers_phoneNumber_idx" ON "external_groomers"("phoneNumber");
CREATE INDEX "grooming_records_externalGroomerId_idx" ON "grooming_records"("externalGroomerId");

ALTER TABLE "external_groomers"
  ADD CONSTRAINT "external_groomers_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "grooming_records"
  ADD CONSTRAINT "grooming_records_externalGroomerId_fkey"
  FOREIGN KEY ("externalGroomerId") REFERENCES "external_groomers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
