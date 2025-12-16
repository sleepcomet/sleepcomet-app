import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient() as any

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
  const status = String(body.status || "investigating").trim()
  const impact = String(body.impact || "minor").trim()
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
