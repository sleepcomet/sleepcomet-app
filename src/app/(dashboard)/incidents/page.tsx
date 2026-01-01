"use client"

import { useEffect, useState } from "react"

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
import { Search, AlertTriangle, Loader2 } from "lucide-react"

type Incident = {
  id: string
  title: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  impact: "critical" | "major" | "minor" | "none"
  startedAt: string
  updatedAt: string
  affectedComponents: string[]
}

export default function IncidentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    let active = true
      ; (async () => {
        try {
          setIsLoading(true)
          const res = await fetch("/api/incidents", { cache: "no-store" })
          if (!res.ok) return
          const data = await res.json()
          if (active) setIncidents(data)
        } finally {
          if (active) setIsLoading(false)
        }
      })()
    return () => { active = false }
  }, [])

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
    const labels: Record<string, string> = {
      investigating: "Investigando",
      identified: "Identificado",
      monitoring: "Monitorando",
      resolved: "Resolvido"
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
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
        <h1 className="text-lg font-semibold">Incidentes</h1>
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
                placeholder="Buscar incidentes..."
                aria-label="Buscar incidentes"
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="investigating">Investigando</SelectItem>
                <SelectItem value="identified">Identificado</SelectItem>
                <SelectItem value="monitoring">Monitorando</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
          </div>
        ) : incidents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Rastreamento de Incidentes</CardTitle>
              <CardDescription>Incidentes são criados automaticamente quando um endpoint tem problema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 border rounded-lg p-10 text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted">
                  <AlertTriangle className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Nenhum incidente ainda</div>
                  <div className="text-sm text-muted-foreground">Adicione endpoints para monitorar e gerar incidents automaticamente.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Todos os Incidentes</CardTitle>
              <CardDescription>
                {filteredIncidents.length} incidente{filteredIncidents.length !== 1 ? "s" : ""} encontrado{filteredIncidents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Incidente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead>Componentes Afetados</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Última Atualização</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
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
                          {incident.impact === "critical" ? "Crítico" :
                            incident.impact === "major" ? "Maior" :
                            incident.impact === "minor" ? "Menor" : "Nenhum"}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
