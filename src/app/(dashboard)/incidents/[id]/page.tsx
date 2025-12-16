"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, AlertTriangle, Activity, Clock } from "lucide-react"

type Incident = {
  id: string
  title: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  impact: "critical" | "major" | "minor" | "none"
  startedAt: string
  updatedAt: string
  affectedComponents: string[]
  timeline?: { time: string; message: string }[]
}

export default function IncidentDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [incident, setIncident] = useState<Incident | null>(null)
  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch(`/api/incidents/${id}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (active) setIncident(data)
    })()
    return () => { active = false }
  }, [id])

function getStatusBadgeVariant(status: Incident["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "investigating" || status === "identified") return "destructive"
  if (status === "monitoring") return "secondary"
  if (status === "resolved") return "outline"
  return "outline"
}

  

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href="/incidents" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{incident?.title || "Incident"}</h1>
          <Badge variant={getStatusBadgeVariant(incident?.status || "resolved")}>{(incident?.status || "resolved").replace(/^./, (c) => c.toUpperCase())}</Badge>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{incident?.status || "resolved"}</div>
              <p className="text-xs text-muted-foreground">Current status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Impact</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{incident?.impact || "none"}</div>
              <p className="text-xs text-muted-foreground">User impact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Started</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incident?.startedAt || "—"}</div>
              <p className="text-xs text-muted-foreground">Incident start time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Update</CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incident?.updatedAt || "—"}</div>
              <p className="text-xs text-muted-foreground">Most recent update</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Affected Components</CardTitle>
            <CardDescription>Systems impacted by this incident</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {(incident?.affectedComponents || []).map((c, i) => (
                <Badge key={i} variant="secondary" className="font-normal text-xs">{c}</Badge>
              ))}
              {(!incident || incident.affectedComponents.length === 0) && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <CardDescription>Updates and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(incident?.timeline || []).map((t, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono whitespace-nowrap">{t.time}</TableCell>
                    <TableCell>{t.message}</TableCell>
                  </TableRow>
                ))}
                {(!incident || !incident.timeline || incident.timeline.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-6">No updates</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/incidents">Back to Incidents</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
