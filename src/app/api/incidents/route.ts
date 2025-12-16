import { NextResponse } from "next/server"
import { PrismaClient, IncidentStatus, IncidentImpact } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient()

export async function GET() {
  const list = await prisma.incident.findMany({
    orderBy: { startedAt: "desc" },
    select: { id: true, title: true, status: true, impact: true, startedAt: true, updatedAt: true, affectedComponents: true },
  })
  return NextResponse.json(list)
}

export async function POST(req: Request) {
  const body = await req.json()
  const title = String(body.title || "").trim()
  const statusInput = String(body.status || "investigating").trim().toLowerCase()
  const impactInput = String(body.impact || "minor").trim().toLowerCase()
  const allowedStatus: IncidentStatus[] = ["investigating", "identified", "monitoring", "resolved"]
  const allowedImpact: IncidentImpact[] = ["critical", "major", "minor", "none"]
  const status: IncidentStatus = (allowedStatus as string[]).includes(statusInput) ? (statusInput as IncidentStatus) : "investigating"
  const impact: IncidentImpact = (allowedImpact as string[]).includes(impactInput) ? (impactInput as IncidentImpact) : "minor"
  const affectedComponents: string[] = Array.isArray(body.affectedComponents) ? body.affectedComponents : []
  const timeline = Array.isArray(body.timeline) ? body.timeline : []
  if (!title) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const created = await prisma.incident.create({
    data: {
      title,
      status,
      impact,
      affectedComponents,
      timeline,
    },
    select: { id: true, title: true, status: true, impact: true, startedAt: true, updatedAt: true, affectedComponents: true },
  })
  return NextResponse.json(created, { status: 201 })
}
