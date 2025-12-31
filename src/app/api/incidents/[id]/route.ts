import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const incident = await prisma.incident.findUnique({
    where: { id },
    select: { id: true, title: true, status: true, impact: true, startedAt: true, updatedAt: true, affectedComponents: true, timeline: true },
  })
  if (!incident) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(incident)
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.incident.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
