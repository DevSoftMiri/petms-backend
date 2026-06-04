ALTER TABLE "pharmacy_deliveries" ADD COLUMN "pharmacyInventoryId" TEXT;

CREATE INDEX "pharmacy_deliveries_pharmacyInventoryId_idx" ON "pharmacy_deliveries"("pharmacyInventoryId");

ALTER TABLE "pharmacy_deliveries" ADD CONSTRAINT "pharmacy_deliveries_pharmacyInventoryId_fkey" FOREIGN KEY ("pharmacyInventoryId") REFERENCES "pharmacy_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
