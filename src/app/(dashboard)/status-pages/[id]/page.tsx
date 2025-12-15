"use client"

import { use } from "react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Globe, ExternalLink, Settings, Users, Activity, AlertTriangle } from "lucide-react"

// Mock data
const statusPagesData: Record<string, {
  name: string
  slug: string
  visibility: "public" | "private"
  status: "operational" | "degraded" | "outage"
  subscribers: number
  lastUpdated: string
  endpoints: { id: string; name: string; status: "up" | "down"; uptime: string }[]
  recentIncidents: { id: string; title: string; status: string; date: string }[]
}> = {
  "1": {
    name: "Public Status",
    slug: "sleepcomet",
    visibility: "public",
    status: "operational",
    subscribers: 245,
    lastUpdated: "2 hours ago",
    endpoints: [
      { id: "1", name: "API Production", status: "up", uptime: "99.9%" },
      { id: "2", name: "Web App", status: "up", uptime: "99.7%" },
      { id: "3", name: "Landing Page", status: "up", uptime: "100%" },
    ],
    recentIncidents: [
      { id: "1", title: "Brief API latency increase", status: "resolved", date: "Dec 10, 2024" },
      { id: "2", title: "Scheduled maintenance", status: "resolved", date: "Dec 5, 2024" },
    ],
  },
  "2": {
    name: "Internal Status",
    slug: "sleepcomet-internal",
    visibility: "private",
    status: "operational",
    subscribers: 12,
    lastUpdated: "30 min ago",
    endpoints: [
      { id: "1", name: "Internal API", status: "up", uptime: "99.5%" },
      { id: "2", name: "Admin Panel", status: "up", uptime: "99.8%" },
    ],
    recentIncidents: [],
  },
  "3": {
    name: "API Status",
    slug: "sleepcomet-api",
    visibility: "public",
    status: "degraded",
    subscribers: 89,
    lastUpdated: "5 min ago",
    endpoints: [
      { id: "1", name: "REST API", status: "up", uptime: "98.5%" },
      { id: "2", name: "GraphQL API", status: "down", uptime: "95.2%" },
    ],
    recentIncidents: [
      { id: "1", title: "GraphQL service degradation", status: "investigating", date: "Dec 15, 2024" },
    ],
  },
  "4": {
    name: "Dev Environment",
    slug: "sleepcomet-dev",
    visibility: "private",
    status: "outage",
    subscribers: 5,
    lastUpdated: "1 min ago",
    endpoints: [
      { id: "1", name: "Dev Server", status: "down", uptime: "85.0%" },
    ],
    recentIncidents: [
      { id: "1", title: "Dev server outage", status: "identified", date: "Dec 15, 2024" },
    ],
  },
}

function getStatusBadge(status: string) {
  switch (status) {
    case "operational":
      return <Badge variant="default">● Operational</Badge>
    case "degraded":
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">● Degraded</Badge>
    case "outage":
      return <Badge variant="destructive">● Outage</Badge>
    default:
      return <Badge variant="outline">● Unknown</Badge>
  }
}

export default function StatusPageDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const page = statusPagesData[id] || statusPagesData["1"]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href="/status-pages" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{page.name}</h1>
          {getStatusBadge(page.status)}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{page.status}</div>
              <p className="text-xs text-muted-foreground">Current status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
              <Globe className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{page.endpoints.length}</div>
              <p className="text-xs text-muted-foreground">Monitored endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{page.subscribers}</div>
              <p className="text-xs text-muted-foreground">Email subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidents</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{page.recentIncidents.length}</div>
              <p className="text-xs text-muted-foreground">Recent incidents</p>
            </CardContent>
          </Card>
        </div>

        {/* Page Info */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="size-4" />
                Page Settings
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/status-pages/${id}/edit`}>
                Edit Settings
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL</span>
              <a
                href={`${(process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.sleepcomet.com')}/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono flex items-center gap-1 hover:underline"
              >
                {(process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.sleepcomet.com')}/{page.slug}
                <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visibility</span>
              <span className="capitalize">{page.visibility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{page.lastUpdated}</span>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <CardDescription>Endpoints displayed on this status page</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium">{endpoint.name}</TableCell>
                    <TableCell>
                      <Badge variant={endpoint.status === "up" ? "default" : "destructive"}>
                        {endpoint.status === "up" ? "● Up" : "● Down"}
                      </Badge>
                    </TableCell>
                    <TableCell>{endpoint.uptime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Incidents</CardTitle>
            <CardDescription>Past and ongoing incidents</CardDescription>
          </CardHeader>
          <CardContent>
            {page.recentIncidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent incidents</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.recentIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.title}</TableCell>
                      <TableCell className="capitalize">{incident.status}</TableCell>
                      <TableCell className="text-muted-foreground">{incident.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
