/*
  Warnings:

  - Added the required column `statusPageId` to the `incidents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "incidents" ADD COLUMN     "statusPageId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "incidents_statusPageId_idx" ON "incidents"("statusPageId");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "status_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
