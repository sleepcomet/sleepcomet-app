"use client"

import { useEffect, useState } from "react"
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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Globe, Loader2 } from "lucide-react"

type Endpoint = { id: string; name: string; url: string; status: "up" | "down"; uptime?: number; last_check?: string }

export default function Dashboard() {
  const router = useRouter()
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError("")
        const res = await fetch("/api/endpoints", { cache: "no-store" })
        if (!res.ok) {
          setError("Failed to load endpoints")
          return
        }
        const data = await res.json()
        if (active) setEndpoints(Array.isArray(data) ? data : [])
      } catch {
        setError("Failed to load endpoints")
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  // Filter endpoints
  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || endpoint.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    ;(async () => {
      const res = await fetch(`/api/endpoints/${id}`, { method: "DELETE" })
      if (!res.ok) return
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id))
    })()
  }

  return (
    <div className="flex flex-col min-h-screen">
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
                placeholder="Search endpoints..."
                aria-label="Search endpoints"
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button asChild>
            <Link href="/endpoints/new">
              <Plus className="size-4 mr-2" />
              New Endpoint
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
              <CardTitle>Start Monitoring</CardTitle>
              <CardDescription>Add your first endpoint to begin tracking uptime and performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 border rounded-lg p-10 text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-muted">
                  <Globe className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">No endpoints yet</div>
                  <div className="text-sm text-muted-foreground">Create an endpoint to see real-time status and analytics.</div>
                </div>
                <Button asChild>
                  <Link href="/endpoints/new">
                    <Plus className="size-4 mr-2" />
                    New Endpoint
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Endpoints</CardTitle>
              <CardDescription>
                {error ? "" : `${filteredEndpoints.length} endpoint${filteredEndpoints.length !== 1 ? "s" : ""} found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Response</TableHead>
                    <TableHead>Last Check</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-destructive py-8">
                        {error}
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
                          {endpoint.status === "up" ? "● Up" : "● Down"}
                        </Badge>
                      </TableCell>
                      <TableCell>{endpoint.uptime ? `${endpoint.uptime}%` : "—"}</TableCell>
                      <TableCell>{"—"}</TableCell>
                      <TableCell className="text-muted-foreground">{endpoint.last_check ? new Date(endpoint.last_check).toLocaleString() : "—"}</TableCell>
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
                              View Details
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
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(endpoint.id, e)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Delete
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
