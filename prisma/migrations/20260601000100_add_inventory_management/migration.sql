CREATE TABLE "pharmacy_inventory" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "dosage" VARCHAR(100),
    "power" VARCHAR(100),
    "type" VARCHAR(50) NOT NULL,
    "weight" VARCHAR(100),
    "mfgDate" TIMESTAMP(3),
    "expDate" TIMESTAMP(3),
    "mrp" DOUBLE PRECISION DEFAULT 0,
    "discount" DOUBLE PRECISION DEFAULT 0,
    "vendor" VARCHAR(255),
    "payable" DOUBLE PRECISION DEFAULT 0,
    "stock" INTEGER DEFAULT 0,
    "inwardDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pharmacy_inventory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "store_items" ADD COLUMN "inwardDate" TIMESTAMP(3);
ALTER TABLE "store_items" ADD COLUMN "outwardDate" TIMESTAMP(3);

CREATE INDEX "pharmacy_inventory_clinicId_idx" ON "pharmacy_inventory"("clinicId");
CREATE INDEX "pharmacy_inventory_productName_idx" ON "pharmacy_inventory"("productName");
CREATE INDEX "pharmacy_inventory_type_idx" ON "pharmacy_inventory"("type");
CREATE INDEX "pharmacy_inventory_vendor_idx" ON "pharmacy_inventory"("vendor");

ALTER TABLE "pharmacy_inventory" ADD CONSTRAINT "pharmacy_inventory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
