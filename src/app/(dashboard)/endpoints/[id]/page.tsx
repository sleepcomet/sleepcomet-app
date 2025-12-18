"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { ArrowLeft, Globe, Activity, TrendingUp, TrendingDown, Zap, Clock } from "lucide-react"
import { useSSE } from "@/hooks/use-sse"

type Metrics = {
  responseTime24h: { hour: string; responseTime: number; p95: number; p99: number }[]
  uptime30d: { day: string; uptime: number }[]
  statusCodesMonth: { code: string; count: number }[]
  hourlyChecksToday: { hour: string; successful: number; failed: number }[]
  responseDistribution: { range: string; count: number }[]
  incidentsMonth: number
}
type Endpoint = { id: string; name: string; url: string; status: "up" | "down"; uptime?: number; last_check?: string; checkInterval?: number; metrics?: Metrics }

const empty24h = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, responseTime: 0, p95: 0, p99: 0 }))
const empty30d = Array.from({ length: 30 }, (_, i) => ({ day: `Day ${i + 1}`, uptime: 0 }))
const emptyStatus = [{ code: "2xx", count: 0 }, { code: "3xx", count: 0 }, { code: "4xx", count: 0 }, { code: "5xx", count: 0 }]
const emptyChecks = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, successful: 0, failed: 0 }))
const emptyDist = [{ range: "0-50ms", count: 0 }, { range: "51-100ms", count: 0 }, { range: "101-200ms", count: 0 }, { range: "201-500ms", count: 0 }, { range: "500ms+", count: 0 }]

const responseChartConfig = {
  responseTime: { label: "Avg Response", color: "hsl(var(--chart-1))" },
  p95: { label: "P95", color: "hsl(var(--chart-2))" },
  p99: { label: "P99", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const uptimeChartConfig = {
  uptime: { label: "Uptime %", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const statusCodesConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-1))" },
  "2xx": { label: "2xx Success", color: "hsl(var(--chart-1))" },
  "3xx": { label: "3xx Redirect", color: "hsl(var(--chart-2))" },
  "4xx": { label: "4xx Client Error", color: "hsl(var(--chart-3))" },
  "5xx": { label: "5xx Server Error", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const checksChartConfig = {
  successful: { label: "Successful", color: "hsl(var(--chart-1))" },
  failed: { label: "Failed", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const distributionConfig = {
  count: { label: "Requests", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig

const DEFAULT_CHECK_INTERVAL = 300 // 5 minutes fallback

export default function EndpointDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [endpoint, setEndpoint] = useState<Endpoint | null>(null)
  const [countdown, setCountdown] = useState(DEFAULT_CHECK_INTERVAL)

  // Get interval from endpoint or use default
  const checkInterval = endpoint?.checkInterval || DEFAULT_CHECK_INTERVAL

  // Calculate remaining time until next check based on last_check
  const calculateCountdown = (lastCheck: string | undefined, interval: number) => {
    if (!lastCheck) return interval
    const elapsed = Math.floor((Date.now() - new Date(lastCheck).getTime()) / 1000)
    const remaining = interval - (elapsed % interval)
    return remaining > 0 ? remaining : interval
  }

  // SSE for real-time updates
  useSSE((data) => {
    if (data.type === 'endpoint_update' && data.endpointId === id) {
      setEndpoint(prev => {
        if (!prev) return prev
        return {
          ...prev,
          status: data.status,
          uptime: data.uptime,
          last_check: new Date().toISOString()
        }
      })
      setCountdown(checkInterval) // Reset countdown on update
    }
  })

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : checkInterval)
    }, 1000)
    return () => clearInterval(timer)
  }, [checkInterval])

  // Initial fetch
  useEffect(() => {
    let active = true
      ; (async () => {
        const res = await fetch(`/api/endpoints/${id}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (active) {
          setEndpoint(data)
          const interval = data.checkInterval || DEFAULT_CHECK_INTERVAL
          setCountdown(calculateCountdown(data.lastCheck || data.last_check, interval))
        }
      })()
    return () => { active = false }
  }, [id])

  const name = endpoint?.name || "Endpoint"
  const status: "up" | "down" = endpoint?.status || "up"
  const rt = (endpoint?.metrics?.responseTime24h || empty24h) as { hour: string; responseTime: number; p95: number; p99: number }[]
  const up = (endpoint?.metrics?.uptime30d || empty30d) as { day: string; uptime: number }[]
  const codes = (endpoint?.metrics?.statusCodesMonth || emptyStatus) as { code: string; count: number }[]
  const checks = (endpoint?.metrics?.hourlyChecksToday || emptyChecks) as { hour: string; successful: number; failed: number }[]
  const dist = (endpoint?.metrics?.responseDistribution || emptyDist) as { range: string; count: number }[]
  const uptimeText = endpoint?.uptime != null ? `${endpoint.uptime.toFixed(2)}%` : "—"
  const lastCheckText = endpoint?.last_check ? new Date(endpoint.last_check).toLocaleString() : "—"
  const avgResponse = rt.length ? Math.round(rt.reduce((acc, d) => acc + d.responseTime, 0) / rt.length) : 0
  const checksToday = checks.reduce((acc, d) => acc + d.successful + d.failed, 0)
  const incidentsMonth = endpoint?.metrics?.incidentsMonth ?? 0

  // Format countdown as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{name}</h1>
          <Badge variant={status === "up" ? "default" : "destructive"}>
            {status === "up" ? "● Up" : "● Down"}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            <Clock className="size-3" />
            <span className="font-mono tabular-nums">{formatTime(countdown)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{uptimeText}</div>
              <p className="text-xs text-muted-foreground">Last 90 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{avgResponse}ms</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Checks Today</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{checksToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Every {formatTime(checkInterval)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              <TrendingDown className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{incidentsMonth}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="size-4" />
              Endpoint Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL</span>
              <span className="font-mono">{endpoint?.url || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Check</span>
              <span className="tabular-nums">{lastCheckText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Check</span>
              <span className="tabular-nums font-medium text-primary">{formatTime(countdown)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check Interval</span>
              <span>{formatTime(checkInterval)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span>GET</span>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Response Time Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Response Time (24h)</CardTitle>
              <CardDescription>Average, P95, and P99 response times</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={responseChartConfig} className="h-[250px] w-full">
                <LineChart data={rt}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="responseTime" stroke="var(--color-responseTime)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95" stroke="var(--color-p95)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" stroke="var(--color-p99)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Uptime Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Uptime (30 days)</CardTitle>
              <CardDescription>Daily uptime percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={uptimeChartConfig} className="h-[250px] w-full">
                <AreaChart data={up}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="uptime" stroke="var(--color-uptime)" fill="var(--color-uptime)" fillOpacity={0.3} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Status Codes Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status Codes</CardTitle>
              <CardDescription>Distribution this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={statusCodesConfig} className="h-[200px] w-full">
                <BarChart data={codes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="code" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Hourly Checks Stacked Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Hourly Checks</CardTitle>
              <CardDescription>Success vs failed today</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={checksChartConfig} className="h-[200px] w-full">
                <BarChart data={checks}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="successful" stackId="a" fill="var(--color-successful)" radius={[0, 0, 2, 2]} />
                  <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Response Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Response Distribution</CardTitle>
              <CardDescription>Response time ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={distributionConfig} className="h-[200px] w-full">
                <BarChart data={dist}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
