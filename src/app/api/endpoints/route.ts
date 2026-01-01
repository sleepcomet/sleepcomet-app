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
  
  // Perform initial check
  const REQUEST_TIMEOUT = 10000
  let initialStatus = "up"
  let responseTime = 0
  
  try {
    const startTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    responseTime = Date.now() - startTime
    const isUp = response.status >= 200 && response.status < 500
    initialStatus = isUp ? "up" : "down"
  } catch {
    initialStatus = "down"
    responseTime = Date.now() - Date.now()
  }

  const created = await prisma.endpoint.create({
    data: { 
      name, 
      url, 
      status: initialStatus, 
      userId: session.user.id,
      lastCheck: new Date(),
    },
    select: { 
      id: true, 
      name: true, 
      url: true, 
      status: true, 
      uptime: true, 
      lastCheck: true, 
      createdAt: true, 
      updatedAt: true,
      statusPages: {
        select: {
          id: true,
          slug: true,
        }
      }
    },
  })

  // Record initial check
  await prisma.endpointCheck.create({
    data: {
      endpointId: created.id,
      isUp: initialStatus === "up",
      responseTimeMs: responseTime,
    }
  })

  console.log(`[Endpoint Created] ${created.name} - Status: ${initialStatus}`)
  console.log(`[Endpoint Created] Associated Status Pages: ${created.statusPages.length}`)

  // If endpoint is down on creation, create incident for all associated status pages
  if (initialStatus === "down") {
    console.log(`[Endpoint Down] Creating incidents for ${created.name}`)
    
    if (created.statusPages.length > 0) {
      for (const page of created.statusPages) {
        console.log(`[Creating Incident] For status page: ${page.slug}`)
        
        await prisma.incident.create({
          data: {
            title: `${created.name} is down`,
            status: 'investigating',
            impact: 'critical',
            affectedComponents: [created.id],
            statusPageId: page.id,
          },
        })

        await prisma.statusPage.update({
          where: { id: page.id },
          data: { status: 'outage' },
        })

        // Notify about incident creation
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sse/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'incident_created',
              statusPageSlug: page.slug,
            }),
          })
        } catch (error) {
          console.error('Failed to notify SSE about incident:', error)
        }
      }
    } else {
      console.log(`[No Status Pages] Endpoint ${created.name} is down but has no status pages associated`)
    }
  }

  // Notify SSE clients about new endpoint
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sse/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'endpoint_created',
        endpoint: {
          id: created.id,
          name: created.name,
          url: created.url,
          status: created.status,
          uptime: created.uptime,
          lastCheck: created.lastCheck,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
        userId: session.user.id,
      }),
    })
  } catch (error) {
    console.error('Failed to notify SSE:', error)
  }

  return NextResponse.json({
    id: created.id,
    name: created.name,
    url: created.url,
    status: created.status,
    uptime: created.uptime,
    lastCheck: created.lastCheck,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  }, { status: 201 })
}
