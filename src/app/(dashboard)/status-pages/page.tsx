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
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, ExternalLink } from "lucide-react"

// Status pages mock data
const statusPages = [
  {
    id: "1",
    name: "Public Status",
    slug: "sleepcomet",
    visibility: "public",
    endpoints: 5,
    status: "operational",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Internal Status",
    slug: "sleepcomet-internal",
    visibility: "private",
    endpoints: 12,
    status: "operational",
    lastUpdated: "30 min ago",
  },
  {
    id: "3",
    name: "API Status",
    slug: "sleepcomet-api",
    visibility: "public",
    endpoints: 3,
    status: "degraded",
    lastUpdated: "5 min ago",
  },
  {
    id: "4",
    name: "Dev Environment",
    slug: "sleepcomet-dev",
    visibility: "private",
    endpoints: 8,
    status: "outage",
    lastUpdated: "1 min ago",
  },
]

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
  const [searchQuery, setSearchQuery] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState("all")

  // Filter status pages
  const filteredPages = statusPages.filter((page) => {
    const matchesSearch =
      page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesVisibility =
      visibilityFilter === "all" || page.visibility === visibilityFilter
    return matchesSearch && matchesVisibility
  })

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement delete logic
    console.log("Delete status page:", id)
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

        {/* Status Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Status Pages</CardTitle>
            <CardDescription>
              {filteredPages.length} status page{filteredPages.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Endpoints</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No status pages found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPages.map((page) => (
                    <TableRow
                      key={page.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/status-pages/${page.id}`)}
                    >
                      <TableCell className="font-medium">{page.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">
                        {process.env.NEXT_PUBLIC_STATUS_URL}/{page.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant={page.visibility === "public" ? "outline" : "secondary"}>
                          {page.visibility === "public" ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell>{page.endpoints}</TableCell>
                      <TableCell>{getStatusBadge(page.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{page.lastUpdated}</TableCell>
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
                                window.open(`${process.env.NEXT_PUBLIC_STATUS_URL}/${page.slug}`, "_blank")
                              }}
                            >
                              <ExternalLink className="size-4 mr-2" />
                              Visit Page
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
                              View Details
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
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive hover:text-destructive"
                              onClick={(e) => handleDelete(page.id, e)}
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
