import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getUserPlanUsage } from "@/lib/subscription"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const endpoints = await prisma.endpoint.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(endpoints)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { usage, limits } = await getUserPlanUsage(session.user.id)
  if (limits.endpoints !== Infinity && usage.endpoints >= limits.endpoints) {
    return NextResponse.json({ error: "Plan limit reached" }, { status: 403 })
  }

  const body = await req.json()
  const name = String(body.name || "").trim()
  const url = String(body.url || "").trim()
  if (!name || !url) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  
  const created = await prisma.endpoint.create({
    data: { name, url, status: "up", userId: session.user.id },
    select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(created, { status: 201 })
}
