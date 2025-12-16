import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient() as any

export async function GET() {
  const pages = await prisma.statusPage.findMany({
    select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(pages)
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = String(body.name || "").trim()
  const slug = String(body.slug || "").trim().toLowerCase()
  const visibility = String(body.visibility || "public").trim()
  const endpointIds: string[] = Array.isArray(body.endpointIds) ? body.endpointIds : []
  if (!name || !slug) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  try {
    const created = await prisma.statusPage.create({
      data: {
        name,
        slug,
        visibility,
        endpoints: endpointIds.length ? { connect: endpointIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    if (String(err?.message || "").includes("Unique constraint failed") || err?.code === "P2002") {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 })
    }
    throw err
  }
}
