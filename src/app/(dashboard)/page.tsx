"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Globe, Loader2 } from "lucide-react"
import { CheckoutHandler } from "@/components/checkout-handler"
import { useEndpoints } from "@/hooks/use-endpoints"
import { NextCheckCountdown } from "@/components/next-check-countdown"

export default function Dashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Use React Query + SSE hook for real-time data
  const { data: endpoints = [], isLoading, error } = useEndpoints()

  // Filter endpoints
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || endpoint.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await fetch(`/api/endpoints/${id}`, { method: "DELETE" })
    if (res.ok) {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <CheckoutHandler />
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Endpoints</h1>
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
                placeholder="Buscar endpoints..."
                aria-label="Buscar endpoints"
                autoComplete="off"
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
                <SelectItem value="up">Online</SelectItem>
                <SelectItem value="down">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button asChild>
            <Link href="/endpoints/new">
              <Plus className="size-4 mr-2" />
              Novo Endpoint
            </Link>
          </Button>
        </div>

        {/* Endpoints Table */}
        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
          </div>
        ) : endpoints.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Comece a Monitorar</CardTitle>
              <CardDescription>Adicione seu primeiro endpoint para começar a monitorar uptime e performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 border rounded-lg p-10 text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted">
                  <Globe className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Nenhum endpoint ainda</div>
                  <div className="text-sm text-muted-foreground">Crie um endpoint para ver status e métricas em tempo real.</div>
                </div>
                <Button asChild>
                  <Link href="/endpoints/new">
                    <Plus className="size-4 mr-2" />
                    Novo Endpoint
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Todos os Endpoints</CardTitle>
              <CardDescription>
                {`${filteredEndpoints.length} endpoint${filteredEndpoints.length !== 1 ? "s" : ""} encontrado${filteredEndpoints.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Próxima Checagem</TableHead>
                    <TableHead>Última Checagem</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-destructive py-8">
                        Falha ao carregar endpoints
                      </TableCell>
                    </TableRow>
                  )}
                  {!error && filteredEndpoints.map((endpoint) => (
                    <TableRow
                      key={endpoint.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/endpoints/${endpoint.id}`)}
                    >
                      <TableCell className="font-medium">{endpoint.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono max-w-[200px] truncate">
                        {endpoint.url}
                      </TableCell>
                      <TableCell>
                        <Badge variant={endpoint.status === "up" ? "default" : "destructive"}>
                          {endpoint.status === "up" ? "● Online" : "● Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{endpoint.uptime ? `${endpoint.uptime.toFixed(2)}%` : "—"}</TableCell>
                      <TableCell>
                        <NextCheckCountdown 
                          lastCheck={endpoint.lastCheck} 
                          checkInterval={endpoint.checkInterval || 300}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{endpoint.lastCheck ? new Date(endpoint.lastCheck).toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-40 p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/endpoints/${endpoint.id}`)
                              }}
                            >
                              <Eye className="size-4 mr-2" />
                              Ver Detalhes
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/endpoints/${endpoint.id}/edit`)
                              }}
                            >
                              <Pencil className="size-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(endpoint.id, e)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Excluir
                            </Button>
                          </PopoverContent>
                        </Popover>
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
