/*
  Warnings:

  - You are about to drop the column `color` on the `pets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customerId]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[petId]` on the table `pets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `petId` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "code" VARCHAR(20),
ADD COLUMN     "customerId" VARCHAR(50);

-- AlterTable
ALTER TABLE "pets" DROP COLUMN "color",
ADD COLUMN     "colour" VARCHAR(100),
ADD COLUMN     "petId" VARCHAR(50);

-- Backfill customerId for existing customers using a numbered sequence
WITH numbered_customers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "customers"
  WHERE "customerId" IS NULL
)
UPDATE "customers" c
SET "customerId" = CONCAT('CUS-', LPAD(nc.rn::TEXT, 4, '0'))
FROM numbered_customers nc
WHERE c.id = nc.id;

-- Generate code for existing customers (first 2 letters of firstName + last 3 digits of phoneNumber)
UPDATE "customers" 
SET "code" = CONCAT(
  UPPER(SUBSTRING(REPLACE("firstName", ' ', ''), 1, 2)),
  SUBSTRING(COALESCE("phoneNumber", '000'), LENGTH(COALESCE("phoneNumber", '000')) - 2, 3)
)
WHERE "code" IS NULL AND "firstName" IS NOT NULL;

-- Backfill petId for existing pets using a numbered sequence
WITH numbered_pets AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "pets"
  WHERE "petId" IS NULL
)
UPDATE "pets" p
SET "petId" = CONCAT('PET-', LPAD(np.rn::TEXT, 4, '0'))
FROM numbered_pets np
WHERE p.id = np.id;

-- Make customerId and petId NOT NULL
ALTER TABLE "customers" ALTER COLUMN "customerId" SET NOT NULL;
ALTER TABLE "pets" ALTER COLUMN "petId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerId_key" ON "customers"("customerId");

-- CreateIndex
CREATE INDEX "customers_customerId_idx" ON "customers"("customerId");

-- CreateIndex
CREATE INDEX "customers_code_idx" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pets_petId_key" ON "pets"("petId");

-- CreateIndex
CREATE INDEX "pets_petId_idx" ON "pets"("petId");
