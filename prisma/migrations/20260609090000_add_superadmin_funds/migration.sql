CREATE TABLE "superadmin_funds" (
    "id" TEXT NOT NULL,
    "donorName" VARCHAR(255) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" VARCHAR(100) NOT NULL,
    "receivedBy" VARCHAR(255) NOT NULL,
    "proofUrl" TEXT,
    "proofFileName" VARCHAR(255),
    "proofMimeType" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "superadmin_funds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "superadmin_funds_date_idx" ON "superadmin_funds"("date");
CREATE INDEX "superadmin_funds_createdAt_idx" ON "superadmin_funds"("createdAt");
