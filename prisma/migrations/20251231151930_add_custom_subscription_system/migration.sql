/*
  Warnings:

  - You are about to drop the column `mpCurrentPeriodEnd` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `mpPreapprovalId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `mpStatus` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCurrentPeriodEnd` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripePriceId` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "subscription_mpPreapprovalId_key";

-- DropIndex
DROP INDEX "subscription_stripeCustomerId_key";

-- DropIndex
DROP INDEX "subscription_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "_StatusPagesOnEndpoints" ADD CONSTRAINT "_StatusPagesOnEndpoints_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_StatusPagesOnEndpoints_AB_unique";

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "mpCurrentPeriodEnd",
DROP COLUMN "mpPreapprovalId",
DROP COLUMN "mpStatus",
DROP COLUMN "stripeCurrentPeriodEnd",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePriceId",
DROP COLUMN "stripeSubscriptionId",
ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "interval" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "lastPaymentAmount" DOUBLE PRECISION,
ADD COLUMN     "lastPaymentDate" TIMESTAMP(3),
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "interval" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "mpStatus" TEXT,
    "mpStatusDetail" TEXT,
    "description" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_mpPaymentId_key" ON "payments"("mpPaymentId");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_mpPaymentId_idx" ON "payments"("mpPaymentId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
