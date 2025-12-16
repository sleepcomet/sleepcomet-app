import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient() as any

export async function GET() {
  const endpoints = await prisma.endpoint.findMany({
    select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(endpoints)
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = String(body.name || "").trim()
  const url = String(body.url || "").trim()
  if (!name || !url) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const created = await prisma.endpoint.create({
    data: { name, url, status: "up" },
    select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true, createdAt: true, updatedAt: true },
  })
  return NextResponse.json(created, { status: 201 })
}
