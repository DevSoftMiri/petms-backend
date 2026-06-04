ALTER TABLE "procedure_records" ADD COLUMN "parentProcedureId" TEXT;

CREATE INDEX "procedure_records_parentProcedureId_idx" ON "procedure_records"("parentProcedureId");

ALTER TABLE "procedure_records" ADD CONSTRAINT "procedure_records_parentProcedureId_fkey" FOREIGN KEY ("parentProcedureId") REFERENCES "procedure_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
