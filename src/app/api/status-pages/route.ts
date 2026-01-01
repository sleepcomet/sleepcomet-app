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

  const pages = await prisma.statusPage.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(pages)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { usage, limits } = await getUserPlanUsage(session.user.id)
  if (limits.statusPages !== Infinity && usage.statusPages >= limits.statusPages) {
    return NextResponse.json({ error: "Plan limit reached" }, { status: 403 })
  }

  const body = await req.json()
  const name = String(body.name || "").trim()
  const slug = String(body.slug || "").trim().toLowerCase()
  const visibility = String(body.visibility || "public").trim()
  const endpointIds: string[] = Array.isArray(body.endpointIds) ? body.endpointIds : []
  
  if (!name || !slug) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })

  if (endpointIds.length > 0) {
    const count = await prisma.endpoint.count({
      where: {
        id: { in: endpointIds },
        userId: session.user.id
      }
    })
    if (count !== endpointIds.length) {
      return NextResponse.json({ error: "Invalid endpoints provided or not owned by user" }, { status: 400 })
    }
  }

  try {
    const created = await prisma.statusPage.create({
      data: {
        name,
        slug,
        visibility,
        userId: session.user.id,
        endpoints: endpointIds.length ? { connect: endpointIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, name: true, slug: true, visibility: true, status: true, createdAt: true, updatedAt: true },
    })

    // Notify SSE clients about new status page
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sse/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'statuspage_created',
          statusPage: created,
          userId: session.user.id,
        }),
      })
    } catch (error) {
      console.error('Failed to notify SSE:', error)
    }

    return NextResponse.json(created, { status: 201 })
  } catch (err: unknown) {
    const msg = String((err as { message?: string })?.message || "")
    const code = (err as { code?: string })?.code
    if (msg.includes("Unique constraint failed") || code === "P2002") {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 })
    }
    throw err
  }
}
