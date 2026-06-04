-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';

-- CreateTable
CREATE TABLE "user_clinics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_clinics_pkey" PRIMARY KEY ("id")
);

-- Backfill existing single-clinic assignments as default memberships.
INSERT INTO "user_clinics" ("id", "userId", "clinicId", "role", "isDefault", "createdAt", "updatedAt")
SELECT
    concat('uc_', md5(random()::text || clock_timestamp()::text || "id")),
    "id",
    "clinicId",
    "role",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "clinicId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "user_clinics_userId_clinicId_key" ON "user_clinics"("userId", "clinicId");

-- CreateIndex
CREATE INDEX "user_clinics_userId_idx" ON "user_clinics"("userId");

-- CreateIndex
CREATE INDEX "user_clinics_clinicId_idx" ON "user_clinics"("clinicId");

-- AddForeignKey
ALTER TABLE "user_clinics" ADD CONSTRAINT "user_clinics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_clinics" ADD CONSTRAINT "user_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
