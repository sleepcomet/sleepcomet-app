"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, ExternalLink, ProportionsIcon, Loader2 } from "lucide-react"

type StatusPage = { id: string; name: string; slug: string; visibility: "public" | "private"; status: string; updated_at?: string }

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

export default function StatusPagesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState("all")

  const { data: pages = [], isLoading, error } = useQuery<StatusPage[], Error>({
    queryKey: ["status-pages"],
    queryFn: async () => {
      const res = await fetch("/api/status-pages", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load status pages")
      return res.json()
    },
    refetchOnWindowFocus: true,
  })

  // SSE listener for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/sse/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') return

        if (data.type === 'statuspage_created') {
          // Add new status page to the list
          queryClient.setQueryData(['status-pages'], (old: StatusPage[] | undefined) => {
            if (!old) return [data.statusPage]
            // Check if status page already exists to avoid duplicates
            const exists = old.some(page => page.id === data.statusPage.id)
            if (exists) return old
            return [data.statusPage, ...old]
          })
        }

        if (data.type === 'statuspage_deleted') {
          // Remove status page from the list
          queryClient.setQueryData(['status-pages'], (old: StatusPage[] | undefined) => {
            if (!old) return old
            return old.filter(page => page.id !== data.statusPageId)
          })
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    return () => {
      eventSource.close()
    }
  }, [queryClient])

  // Filter status pages
  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVisibility =
      visibilityFilter === "all" || page.visibility === visibilityFilter
    return matchesSearch && matchesVisibility
  })

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await fetch(`/api/status-pages/${id}`, { method: "DELETE" })
    if (!res.ok) return
    await queryClient.invalidateQueries({ queryKey: ["status-pages"] })
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Status Pages</h1>
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
                placeholder="Search status pages..."
                aria-label="Search status pages"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Visibility Filter */}
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button asChild>
            <Link href="/status-pages/new">
              <Plus className="size-4 mr-2" />
              New Status Page
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="size-12 animate-spin text-muted-foreground" />
          </div>
        ) : pages.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Crie Sua Primeira Página de Status</CardTitle>
              <CardDescription>Publique uptime e incidentes para seus usuários.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 border rounded-lg p-10 text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted">
                  <ProportionsIcon className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">Nenhuma página de status ainda</div>
                  <div className="text-sm text-muted-foreground">Crie uma página pública ou privada para compartilhar atualizações.</div>
                </div>
                <Button asChild>
                  <Link href="/status-pages/new">
                    <Plus className="size-4 mr-2" />
                    Nova Página de Status
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Todas as Páginas de status</CardTitle>
              <CardDescription>
                {error ? "" : `${filteredPages.length} página${filteredPages.length !== 1 ? "s" : ""} encontrada${filteredPages.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Domínio</TableHead>
                    <TableHead>Visibilidade</TableHead>
                    <TableHead>Endpoints</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-destructive py-8">
                        {error.message}
                      </TableCell>
                    </TableRow>
                  )}
                  {!error && filteredPages.map((page) => (
                    <TableRow
                      key={page.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/status-pages/${page.id}`)}
                    >
                      <TableCell className="font-medium">{page.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {(process.env.NEXT_PUBLIC_STATUS_URL || "https://status.sleepcomet.com")}/{page.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.visibility === "public" ? "outline" : "secondary"}>
                          {page.visibility === "public" ? "Pública" : "Privada"}
                        </Badge>
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{getStatusBadge(page.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{page.updated_at ? new Date(page.updated_at).toLocaleString() : "—"}</TableCell>
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
                                window.open(`${process.env.NEXT_PUBLIC_STATUS_URL || "https://status.sleepcomet.com"}/${page.slug}`, "_blank")
                              }}
                            >
                              <ExternalLink className="size-4 mr-2" />
                              Visitar Página
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/status-pages/${page.id}`)
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
                                router.push(`/status-pages/${page.id}/edit`)
                              }}
                            >
                              <Pencil className="size-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(page.id, e)}
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
