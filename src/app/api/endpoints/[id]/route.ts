import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const ep = await prisma.endpoint.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      url: true,
      status: true,
      uptime: true,
      lastCheck: true,
      checkInterval: true,
      createdAt: true,
      updatedAt: true
    },
  })

  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Get real metrics from endpoint_checks table
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())


  const recentChecks = await prisma.endpointCheck.findMany({
    where: {
      endpointId: id,
      checkedAt: { gte: twentyFourHoursAgo }
    },
    orderBy: { checkedAt: 'desc' },
    select: { isUp: true, responseTimeMs: true, checkedAt: true }
  })


  const monthlyChecks = await prisma.endpointCheck.findMany({
    where: {
      endpointId: id,
      checkedAt: { gte: thirtyDaysAgo }
    },
    orderBy: { checkedAt: 'desc' },
    select: { isUp: true, responseTimeMs: true, checkedAt: true }
  })

  // Build Response Time 24h (hourly averages)
  const hourlyData: Record<number, { total: number; count: number; times: number[] }> = {}
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { total: 0, count: 0, times: [] }
  }

  for (const check of recentChecks) {
    const hour = new Date(check.checkedAt).getHours()
    hourlyData[hour].total += check.responseTimeMs
    hourlyData[hour].count++
    hourlyData[hour].times.push(check.responseTimeMs)
  }

  const responseTime24h = Array.from({ length: 24 }, (_, i) => {
    const data = hourlyData[i]
    if (data.count === 0) return { hour: `${i}:00`, responseTime: 0, p95: 0, p99: 0 }

    const sorted = [...data.times].sort((a, b) => a - b)
    const avg = Math.round(data.total / data.count)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    return {
      hour: `${i}:00`,
      responseTime: avg,
      p95: sorted[p95Index] || avg,
      p99: sorted[p99Index] || avg,
    }
  })

  // Build Uptime 30d (daily uptime percentages)
  const dailyData: Record<string, { up: number; total: number }> = {}

  for (const check of monthlyChecks) {
    const date = new Date(check.checkedAt).toISOString().split('T')[0]
    if (!dailyData[date]) dailyData[date] = { up: 0, total: 0 }
    dailyData[date].total++
    if (check.isUp) dailyData[date].up++
  }

  const uptime30d = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const data = dailyData[dateStr]
    const uptime = data && data.total > 0 ? Math.round((data.up / data.total) * 100) : 100
    return { day: `Day ${i + 1}`, uptime }
  })

  // Build Status Codes (simulated based on checks - real implementation would need status code storage)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const successfulChecks = monthlyChecks.filter((c: any) => c.isUp).length
  const failedChecks = monthlyChecks.length - successfulChecks

  const statusCodesMonth = [
    { code: "2xx", count: successfulChecks },
    { code: "3xx", count: 0 },
    { code: "4xx", count: 0 },
    { code: "5xx", count: failedChecks },
  ]

  // Build Hourly Checks Today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayChecks = recentChecks.filter((c: any) => new Date(c.checkedAt) >= todayStart)
  const hourlyChecksData: Record<number, { successful: number; failed: number }> = {}

  for (let i = 0; i < 24; i++) {
    hourlyChecksData[i] = { successful: 0, failed: 0 }
  }

  for (const check of todayChecks) {
    const hour = new Date(check.checkedAt).getHours()
    if (check.isUp) {
      hourlyChecksData[hour].successful++
    } else {
      hourlyChecksData[hour].failed++
    }
  }

  const hourlyChecksToday = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    successful: hourlyChecksData[i].successful,
    failed: hourlyChecksData[i].failed,
  }))

  // Build Response Distribution
  const distribution = { "0-50": 0, "51-100": 0, "101-200": 0, "201-500": 0, "500+": 0 }

  for (const check of recentChecks) {
    const time = check.responseTimeMs
    if (time <= 50) distribution["0-50"]++
    else if (time <= 100) distribution["51-100"]++
    else if (time <= 200) distribution["101-200"]++
    else if (time <= 500) distribution["201-500"]++
    else distribution["500+"]++
  }

  const responseDistribution = [
    { range: "0-50ms", count: distribution["0-50"] },
    { range: "51-100ms", count: distribution["51-100"] },
    { range: "101-200ms", count: distribution["101-200"] },
    { range: "201-500ms", count: distribution["201-500"] },
    { range: "500ms+", count: distribution["500+"] },
  ]

  // Count incidents this month
  const incidentsMonth = await prisma.incident.count({
    where: {
      statusPage: {
        endpoints: { some: { id } }
      },
      startedAt: { gte: thirtyDaysAgo }
    }
  })

  const metrics = {
    responseTime24h,
    uptime30d,
    statusCodesMonth,
    hourlyChecksToday,
    responseDistribution,
    incidentsMonth,
  }

  return NextResponse.json({ ...ep, metrics })
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  
  try {
    const body = await req.json()
    const { name, url, checkInterval, requestTimeout, alertsEnabled, sslVerification } = body

    // Validate required fields
    if (!name || !url) {
      return NextResponse.json(
        { message: "Nome e URL são obrigatórios" },
        { status: 400 }
      )
    }

    // Update endpoint
    const updated = await prisma.endpoint.update({
      where: { id },
      data: {
        name,
        url,
        ...(checkInterval !== undefined && { checkInterval }),
        ...(requestTimeout !== undefined && { requestTimeout }),
        ...(alertsEnabled !== undefined && { alertsEnabled }),
        ...(sslVerification !== undefined && { sslVerification }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating endpoint:", error)
    return NextResponse.json(
      { message: "Erro ao atualizar endpoint" },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  
  // Get endpoint before deleting to notify with details
  const endpoint = await prisma.endpoint.findUnique({ where: { id } })
  
  await prisma.endpoint.delete({ where: { id } })

  // Notify SSE clients about deleted endpoint
  if (endpoint) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sse/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'endpoint_deleted',
          endpointId: id,
          userId: endpoint.userId,
        }),
      })
    } catch (error) {
      console.error('Failed to notify SSE:', error)
    }
  }

  return NextResponse.json({ ok: true })
}
