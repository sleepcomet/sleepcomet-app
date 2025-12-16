"use client"

import { use, useState, useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Globe, Palette, Bell, Check, X, Loader2 } from "lucide-react"

// Mock taken slugs for validation (excluding own slug)
const takenSlugs = ["public", "api", "internal", "dev", "prod", "main", "test"]

type Endpoint = { id: string; name: string; url: string }

export default function EditStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: page } = useQuery<{ id: string; name: string; slug: string; visibility: "public" | "private"; endpoints: Endpoint[] }>({
    queryKey: ["status-page", id],
    queryFn: async () => {
      const res = await fetch(`/api/status-pages/${id}`, { cache: "no-store" })
      return res.json()
    },
  })
  const { data: endpoints = [] } = useQuery<Endpoint[]>({
    queryKey: ["endpoints"],
    queryFn: async () => {
      const res = await fetch("/api/endpoints", { cache: "no-store" })
      return res.json()
    },
    refetchOnWindowFocus: false,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [showIncidentHistory, setShowIncidentHistory] = useState(true)
  const [showUptimeGraph, setShowUptimeGraph] = useState(true)
  const [allowSubscriptions, setAllowSubscriptions] = useState(true)
  const [customLogo, setCustomLogo] = useState(false)
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([])

  useEffect(() => {
    if (!page) return
    const timer = setTimeout(() => {
      setName(page.name ?? "")
      setSlug(page.slug ?? "")
      setVisibility((page.visibility as "public" | "private") ?? "public")
      setSelectedEndpointIds((page.endpoints || []).map((e: Endpoint) => e.id))
    }, 0)
    return () => clearTimeout(timer)
  }, [page])

  // Slug availability check
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const originalSlug = page?.slug || ""

  // Check slug availability with debounce
  useEffect(() => {
    if (slug === originalSlug || !slug || slug.length < 2) {
      return
    }

    const start = setTimeout(() => {
      setIsCheckingSlug(true)
    }, 0)

    const timer = setTimeout(() => {
      const isAvailable = !takenSlugs.includes(slug.toLowerCase())
      setSlugAvailable(isAvailable)
      setIsCheckingSlug(false)
    }, 500)

    return () => {
      clearTimeout(start)
      clearTimeout(timer)
    }
  }, [slug, originalSlug])

  const computedSlugAvailable = useMemo(() => {
    if (slug === originalSlug) return true
    if (!slug || slug.length < 2) return null
    return slugAvailable
  }, [slug, originalSlug, slugAvailable])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (slug !== originalSlug && slugAvailable === false) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/status-pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, visibility, endpointIds: selectedEndpointIds }),
      })
      if (res.status === 409) {
        setSlugAvailable(false)
        setIsLoading(false)
        return
      }
      if (!res.ok) {
        setIsLoading(false)
        return
      }
      await res.json()
      await queryClient.invalidateQueries({ queryKey: ["status-pages"] })
      await queryClient.invalidateQueries({ queryKey: ["status-page", id] })
      setIsLoading(false)
      router.push(`/status-pages/${id}`)
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b px-4">
        <SidebarTrigger />
        <Link href={`/status-pages/${id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex-1" />
        <h1 className="text-lg font-semibold">Edit Status Page</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="size-4" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your status page settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Page Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Public Status"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {(process.env.NEXT_PUBLIC_STATUS_URL || 'https://status.sleepcomet.com')}/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="slug"
                        autoComplete="off"
                        placeholder="my-company"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className={computedSlugAvailable === false ? "border-destructive pr-10" : computedSlugAvailable === true ? "border-green-500 pr-10" : "pr-10"}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        )}
                        {!isCheckingSlug && computedSlugAvailable === true && (
                          <Check className="size-4 text-green-500" />
                        )}
                        {!isCheckingSlug && computedSlugAvailable === false && (
                          <X className="size-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                  {computedSlugAvailable === false && (
                    <p className="text-xs text-destructive">
                      This slug is already taken. Please choose another one.
                    </p>
                  )}
                  {computedSlugAvailable === true && slug !== originalSlug && (
                    <p className="text-xs text-green-500">
                      This slug is available!
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
                    <SelectTrigger id="visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                      <SelectItem value="private">Private - Password protected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="size-4" />
                  Endpoints
                </CardTitle>
                <CardDescription>
                  Selecione os endpoints exibidos nesta status page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {endpoints.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum endpoint disponível</div>
                ) : (
                  endpoints.map((ep) => (
                    <label key={ep.id} className="flex items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEndpointIds.includes(ep.id)}
                        onChange={(e) => {
                          setSelectedEndpointIds((prev) => {
                            if (e.target.checked) return [...prev, ep.id]
                            return prev.filter((id) => id !== ep.id)
                          })
                        }}
                      />
                      <span className="font-medium">{ep.name}</span>
                      <span className="text-muted-foreground font-mono truncate max-w-[240px]">{ep.url}</span>
                    </label>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="size-4" />
                  Display Settings
                </CardTitle>
                <CardDescription>
                  Customize what visitors see
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="incidentHistory">Show Incident History</Label>
                    <p className="text-xs text-muted-foreground">
                      Display past incidents and their resolutions
                    </p>
                  </div>
                  <Switch
                    id="incidentHistory"
                    checked={showIncidentHistory}
                    onCheckedChange={setShowIncidentHistory}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="uptimeGraph">Show Uptime Graph</Label>
                    <p className="text-xs text-muted-foreground">
                      Display a visual graph of uptime over time
                    </p>
                  </div>
                  <Switch
                    id="uptimeGraph"
                    checked={showUptimeGraph}
                    onCheckedChange={setShowUptimeGraph}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="customLogo">Use Custom Logo</Label>
                    <p className="text-xs text-muted-foreground">
                      Display your own logo instead of Sleepcomet branding
                    </p>
                  </div>
                  <Switch
                    id="customLogo"
                    checked={customLogo}
                    onCheckedChange={setCustomLogo}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="size-4" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure subscriber settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="subscriptions">Allow Subscriptions</Label>
                    <p className="text-xs text-muted-foreground">
                      Let visitors subscribe to email notifications
                    </p>
                  </div>
                  <Switch
                    id="subscriptions"
                    checked={allowSubscriptions}
                    onCheckedChange={setAllowSubscriptions}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" asChild>
                <Link href={`/status-pages/${id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading || (slug !== originalSlug && computedSlugAvailable === false)}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
