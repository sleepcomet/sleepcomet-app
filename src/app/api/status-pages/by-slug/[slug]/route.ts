import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient()

export async function GET(_: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const s = slug.toLowerCase()
  const page = await prisma.statusPage.findUnique({
    where: { slug: s },
    select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true, endpoints: { select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true } } },
  })
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(page)
}
