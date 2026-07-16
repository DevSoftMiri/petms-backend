const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class SuperAdminFundsService {
    async ensureFundsTable() {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "superadmin_funds" (
                "id" TEXT NOT NULL,
                "donorName" VARCHAR(255) NOT NULL,
                "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
                "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "paymentMode" VARCHAR(100) NOT NULL,
                "receivedBy" VARCHAR(255) NOT NULL,
                "proofUrl" TEXT,
                "proofFileName" VARCHAR(255),
                "proofMimeType" VARCHAR(100),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "deletedAt" TIMESTAMP(3),
                CONSTRAINT "superadmin_funds_pkey" PRIMARY KEY ("id")
            )
        `);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "superadmin_funds"
            ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "proofUrl" TEXT,
            ADD COLUMN IF NOT EXISTS "proofFileName" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "proofMimeType" VARCHAR(100),
            ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)
        `);
    }

    async getFunds() {
        await this.ensureFundsTable();

        return prisma.$queryRaw`
            SELECT
                id,
                "donorName",
                amount,
                date,
                "paymentMode",
                "receivedBy",
                "proofUrl",
                "proofFileName",
                "proofMimeType",
                "createdAt",
                "updatedAt",
                "deletedAt"
            FROM "superadmin_funds"
            WHERE "deletedAt" IS NULL
            ORDER BY date DESC, "createdAt" DESC
        `;
    }

    async createFund(fundData) {
        await this.ensureFundsTable();

        const fundId = crypto.randomUUID();
        const rows = await prisma.$queryRaw`
            INSERT INTO "superadmin_funds" (
                id,
                "donorName",
                amount,
                date,
                "paymentMode",
                "receivedBy",
                "proofUrl",
                "proofFileName",
                "proofMimeType",
                "createdAt",
                "updatedAt"
            )
            VALUES (
                ${fundId},
                ${fundData.donorName},
                ${parseFloat(fundData.amount)},
                ${fundData.date ? new Date(fundData.date) : new Date()},
                ${fundData.paymentMode},
                ${fundData.receivedBy},
                ${fundData.proofUrl || null},
                ${fundData.proofFileName || null},
                ${fundData.proofMimeType || null},
                NOW(),
                NOW()
            )
            RETURNING
                id,
                "donorName",
                amount,
                date,
                "paymentMode",
                "receivedBy",
                "proofUrl",
                "proofFileName",
                "proofMimeType",
                "createdAt",
                "updatedAt",
                "deletedAt"
        `;

        return rows[0];
    }
}

module.exports = new SuperAdminFundsService();
