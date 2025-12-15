"use client"

import { use } from "react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { ArrowLeft, Globe, Activity, TrendingUp, TrendingDown, Zap } from "lucide-react"

// Mock data - in real app this would come from API
const endpointsData: Record<string, {
  name: string
  url: string
  status: "up" | "down"
  uptime: string
  avgResponse: number
  lastCheck: string
  checksToday: number
  incidentsMonth: number
}> = {
  "1": {
    name: "API Production",
    url: "https://api.sleepcomet.com/health",
    status: "up",
    uptime: "99.9%",
    avgResponse: 124,
    lastCheck: "30s ago",
    checksToday: 2880,
    incidentsMonth: 2,
  },
  "2": {
    name: "Web App",
    url: "https://app.sleepcomet.com",
    status: "up",
    uptime: "99.7%",
    avgResponse: 89,
    lastCheck: "25s ago",
    checksToday: 2875,
    incidentsMonth: 5,
  },
  "3": {
    name: "Landing Page",
    url: "https://sleepcomet.com",
    status: "up",
    uptime: "100%",
    avgResponse: 45,
    lastCheck: "15s ago",
    checksToday: 2880,
    incidentsMonth: 0,
  },
  "4": {
    name: "Status Page",
    url: "https://status.sleepcomet.com",
    status: "down",
    uptime: "98.2%",
    avgResponse: 0,
    lastCheck: "1m ago",
    checksToday: 2850,
    incidentsMonth: 12,
  },
  "5": {
    name: "Docs",
    url: "https://docs.sleepcomet.com",
    status: "up",
    uptime: "99.5%",
    avgResponse: 156,
    lastCheck: "45s ago",
    checksToday: 2870,
    incidentsMonth: 3,
  },
}

// Response time over 24 hours
const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  responseTime: Math.floor(Math.random() * 100) + 50,
  p95: Math.floor(Math.random() * 50) + 150,
  p99: Math.floor(Math.random() * 100) + 200,
}))

// Uptime over 30 days
const uptimeData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  uptime: Math.random() > 0.1 ? 100 : Math.floor(Math.random() * 20) + 80,
}))

// Status codes distribution
const statusCodesData = [
  { code: "2xx", count: 28450, fill: "hsl(var(--chart-1))" },
  { code: "3xx", count: 320, fill: "hsl(var(--chart-2))" },
  { code: "4xx", count: 85, fill: "hsl(var(--chart-3))" },
  { code: "5xx", count: 25, fill: "hsl(var(--chart-5))" },
]

// Hourly checks
const hourlyChecksData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  successful: Math.floor(Math.random() * 10) + 110,
  failed: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0,
}))

// Response time distribution
const responseDistribution = [
  { range: "0-50ms", count: 1200 },
  { range: "51-100ms", count: 2800 },
  { range: "101-200ms", count: 1500 },
  { range: "201-500ms", count: 300 },
  { range: "500ms+", count: 80 },
]

const responseChartConfig = {
  responseTime: { label: "Avg Response", color: "hsl(var(--chart-1))" },
  p95: { label: "P95", color: "hsl(var(--chart-2))" },
  p99: { label: "P99", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

const uptimeChartConfig = {
  uptime: { label: "Uptime %", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

const statusCodesConfig = {
  count: { label: "Requests" },
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

export default function EndpointDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const endpoint = endpointsData[id] || endpointsData["1"]

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
          <h1 className="text-lg font-semibold">{endpoint.name}</h1>
          <Badge variant={endpoint.status === "up" ? "default" : "destructive"}>
            {endpoint.status === "up" ? "● Up" : "● Down"}
          </Badge>
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
              <div className="text-2xl font-bold">{endpoint.uptime}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
              <Zap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{endpoint.avgResponse}ms</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Checks Today</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{endpoint.checksToday.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Every 30 seconds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              <TrendingDown className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{endpoint.incidentsMonth}</div>
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
              <span className="font-mono">{endpoint.url}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Check</span>
              <span>{endpoint.lastCheck}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check Interval</span>
              <span>30 seconds</span>
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
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="responseTime" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p99" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
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
                <AreaChart data={uptimeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={4} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="uptime"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
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
                <BarChart data={statusCodesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="code" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={40} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={4} />
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
                <BarChart data={hourlyChecksData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="successful" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 2, 2]} />
                  <Bar dataKey="failed" stackId="a" fill="hsl(var(--chart-5))" radius={[2, 2, 0, 0]} />
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
                <BarChart data={responseDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
