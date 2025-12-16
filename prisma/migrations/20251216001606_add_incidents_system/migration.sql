-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');

-- CreateEnum
CREATE TYPE "IncidentImpact" AS ENUM ('critical', 'major', 'minor', 'none');

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "impact" "IncidentImpact" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "affectedComponents" TEXT[],
    "timeline" JSONB,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);
