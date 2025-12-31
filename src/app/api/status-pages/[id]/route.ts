import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: param } = await ctx.params
  const page = await prisma.statusPage.findUnique({
    where: { id: param },
    select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true, endpoints: { select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true } } },
  })
  const bySlug = page ? null : await prisma.statusPage.findUnique({
    where: { slug: param },
    select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true, endpoints: { select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true } } },
  })
  const p = page || bySlug
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await req.json()
  try {
    const updated = await prisma.statusPage.update({
      where: { id },
      data: {
        name: typeof body.name === "string" ? String(body.name).trim() : undefined,
        slug: typeof body.slug === "string" ? String(body.slug).trim().toLowerCase() : undefined,
        visibility: typeof body.visibility === "string" ? String(body.visibility).trim() : undefined,
        status: typeof body.status === "string" ? String(body.status).trim() : undefined,
        endpoints: Array.isArray(body.endpointIds)
          ? { set: (body.endpointIds as string[]).map((eid) => ({ id: eid })) }
          : undefined,
      },
      select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true, endpoints: { select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true } } },
    })
    return NextResponse.json(updated)
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || "")
    const code = (err as { code?: string })?.code
    if (msg.includes("Unique constraint failed") || code === "P2002") {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 })
    }
    throw err
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.statusPage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
