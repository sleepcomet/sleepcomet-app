"use client"

import { use, useEffect, useState } from "react"
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

type Endpoint = { id: string; name: string; status: "up" | "down"; uptime?: number }
type StatusPage = { id: string; name: string; slug: string; visibility: "public" | "private"; status: string; endpoints: Endpoint[]; updated_at?: string }

function getStatusBadge(status: string) {
  switch (status) {
    case "operational":
      return <Badge variant="default">● Operacional</Badge>
    case "degraded":
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">● Degradado</Badge>
    case "outage":
      return <Badge variant="destructive">● Interrupção</Badge>
    default:
      return <Badge variant="outline">● Desconhecido</Badge>
  }
}

export default function StatusPageDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [page, setPage] = useState<StatusPage | null>(null)
  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch(`/api/status-pages/${id}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      if (active) setPage(data)
    })()
    return () => { active = false }
  }, [id])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href="/status-pages" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{page?.name || "Página de Status"}</h1>
          {getStatusBadge(page?.status || "operational")}
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
              <div className="text-2xl font-bold capitalize">{page?.status || "operacional"}</div>
              <p className="text-xs text-muted-foreground">Status atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
              <Globe className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{page?.endpoints?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Endpoints monitorados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inscritos</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Inscritos por email</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidentes</CardTitle>
              <AlertTriangle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Incidentes recentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Page Info */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="size-4" />
                Configurações da Página
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/status-pages/${id}/edit`}>
                Editar Configurações
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL</span>
              <a
                href={`${(process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.sleepcomet.com')}/${page?.slug || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono flex items-center gap-1 hover:underline"
              >
                {(process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.sleepcomet.com')}/{page?.slug || ''}
                <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visibilidade</span>
              <span className="capitalize">{page?.visibility || "public"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última Atualização</span>
              <span>{page?.updated_at ? new Date(page.updated_at).toLocaleString() : "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
            <CardDescription>Endpoints exibidos nesta página de status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(page?.endpoints || []).map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium">{endpoint.name}</TableCell>
                    <TableCell>
                      <Badge variant={endpoint.status === "up" ? "default" : "destructive"}>
                        {endpoint.status === "up" ? "● Online" : "● Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>{endpoint.uptime != null ? `${endpoint.uptime}%` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Incidentes Recentes</CardTitle>
            <CardDescription>Incidentes passados e em andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum incidente recente</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
