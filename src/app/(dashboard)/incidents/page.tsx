"use client"

import { useState } from "react"

import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

// Mock Incidents Data
const incidents = [
  {
    id: "101",
    title: "Database Read Latency Spike",
    status: "investigating", // investigating, identified, monitoring, resolved
    impact: "major", // critical, major, minor, none
    startedAt: "15 mins ago",
    updatedAt: "2 mins ago",
    affectedComponents: ["API Production", "Web App"],
  },
  {
    id: "102",
    title: "Payment Gateway Errors",
    status: "identified",
    impact: "critical",
    startedAt: "1 hour ago",
    updatedAt: "20 mins ago",
    affectedComponents: ["API Production"],
  },
  {
    id: "103",
    title: "Scheduled Maintenance: US-East",
    status: "resolved",
    impact: "minor",
    startedAt: "2 days ago",
    updatedAt: "2 days ago",
    affectedComponents: ["All Systems"],
  },
  {
    id: "104",
    title: "Web App 502 Errors",
    status: "resolved",
    impact: "major",
    startedAt: "3 days ago",
    updatedAt: "3 days ago",
    affectedComponents: ["Web App"],
  },
  {
    id: "105",
    title: "Email Delivery Delays",
    status: "monitoring",
    impact: "minor",
    startedAt: "5 hours ago",
    updatedAt: "1 hour ago",
    affectedComponents: ["Notifications"],
  },
]

export default function IncidentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Helper for Status Badge Color
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "investigating":
        return "destructive"
      case "critical":
        return "destructive"
      case "identified":
        return "default" // or a warning color if configured
      case "monitoring":
        return "secondary"
      case "resolved":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Filter Incidents
  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || incident.status === statusFilter
    return matchesSearch && matchesStatus
  })



  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Incidents</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex flex-1 gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* Incidents Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Incidents</CardTitle>
            <CardDescription>
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Incident</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Affected Components</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No incidents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/incidents/${incident.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{incident.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(incident.status)}>
                          {getStatusLabel(incident.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`capitalize font-medium ${incident.impact === "critical" ? "text-destructive" :
                          incident.impact === "major" ? "text-orange-500" :
                            "text-muted-foreground"
                          }`}>
                          {incident.impact}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {incident.affectedComponents.map((comp, idx) => (
                            <Badge key={idx} variant="secondary" className="font-normal text-xs">
                              {comp}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {incident.startedAt}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {incident.updatedAt}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main >
    </div >
  )
}
