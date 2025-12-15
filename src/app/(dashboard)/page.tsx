"use client"

import { useState } from "react"
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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"

// Endpoints mock data
const endpoints = [
  {
    id: "1",
    name: "API Production",
    url: "https://api.sleepcomet.com/health",
    status: "up",
    uptime: "99.9%",
    responseTime: "124ms",
    lastCheck: "30s ago",
  },
  {
    id: "2",
    name: "Web App",
    url: "https://app.sleepcomet.com",
    status: "up",
    uptime: "99.7%",
    responseTime: "89ms",
    lastCheck: "25s ago",
  },
  {
    id: "3",
    name: "Landing Page",
    url: "https://sleepcomet.com",
    status: "up",
    uptime: "100%",
    responseTime: "45ms",
    lastCheck: "15s ago",
  },
  {
    id: "4",
    name: "Status Page",
    url: "https://status.sleepcomet.com",
    status: "down",
    uptime: "98.2%",
    responseTime: "—",
    lastCheck: "1m ago",
  },
  {
    id: "5",
    name: "Docs",
    url: "https://docs.sleepcomet.com",
    status: "up",
    uptime: "99.5%",
    responseTime: "156ms",
    lastCheck: "45s ago",
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

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
    // TODO: Implement delete logic
    console.log("Delete endpoint:", id)
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
        <Card>
          <CardHeader>
            <CardTitle>All Endpoints</CardTitle>
            <CardDescription>
              {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? "s" : ""} found
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
                {filteredEndpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No endpoints found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEndpoints.map((endpoint) => (
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
                      <TableCell>{endpoint.uptime}</TableCell>
                      <TableCell>{endpoint.responseTime}</TableCell>
                      <TableCell className="text-muted-foreground">{endpoint.lastCheck}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
