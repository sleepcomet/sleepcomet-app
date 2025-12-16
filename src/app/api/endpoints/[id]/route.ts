import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const prisma = new PrismaClient() as any

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const ep = await prisma.endpoint.findUnique({
    where: { id },
    select: { id: true, name: true, url: true, status: true, uptime: true, lastCheck: true, createdAt: true, updatedAt: true },
  })
  if (!ep) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const url = new URL(req.url)
  const stream = url.searchParams.get("stream")
  function buildMetrics(base: any) {
    const now = Date.now()
    const responseTime24h = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      responseTime: 60 + (((i + now) % 37)),
      p95: 150 + (((i + now) % 53)),
      p99: 200 + (((i + now) % 89)),
    }))
    const uptime30d = Array.from({ length: 30 }, (_, i) => ({
      day: `Day ${i + 1}`,
      uptime: typeof base.uptime === "number" ? base.uptime : 99,
    }))
    const statusCodesMonth = [
      { code: "2xx", count: 25000 + (now % 100) },
      { code: "3xx", count: 300 + (now % 20) },
      { code: "4xx", count: 120 + (now % 10) },
      { code: "5xx", count: base.status === "down" ? 200 + (now % 50) : 40 + (now % 5) },
    ]
    const hourlyChecksToday = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      successful: base.status === "down" ? Math.floor(80 + (i % 10)) : Math.floor(110 + (i % 10)),
      failed: base.status === "down" ? Math.floor((i % 5) + 5) : Math.floor((i % 5)),
    }))
    const responseDistribution = [
      { range: "0-50ms", count: 1200 },
      { range: "51-100ms", count: 2800 },
      { range: "101-200ms", count: 1500 },
      { range: "201-500ms", count: 300 },
      { range: "500ms+", count: 80 },
    ]
    const incidentsMonth = base.status === "down" ? 1 : 0
    return {
      responseTime24h,
      uptime30d,
      statusCodesMonth,
      hourlyChecksToday,
      responseDistribution,
      incidentsMonth,
    }
  }
  if (stream) {
    const encoder = new TextEncoder()
    const ts = new TransformStream()
    const writer = ts.writable.getWriter()
    let intervalId: any
    let done = false
    const cleanup = () => {
      if (done) return
      done = true
      if (intervalId) clearInterval(intervalId)
      try { writer.close() } catch {}
    }
    const write = (s: string) => {
      if (done) return
      writer.write(encoder.encode(s)).catch(() => {
        cleanup()
      })
    }
    writer.closed.then(() => cleanup()).catch(() => cleanup())
    try {
      const abortSignal: AbortSignal | undefined = (req as any).signal
      abortSignal?.addEventListener("abort", () => cleanup())
    } catch {}
    const push = () => {
      if (done) return
      try {
        const metrics = buildMetrics(ep)
        const payload = JSON.stringify({ metrics, last_check: new Date().toISOString() })
        write(`data: ${payload}\n\n`)
      } catch {
        cleanup()
      }
    }
    push()
    intervalId = setInterval(push, 3000)
    return new Response(ts.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  }
  const metrics = buildMetrics(ep)
  return NextResponse.json({ ...ep, metrics })
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.endpoint.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
