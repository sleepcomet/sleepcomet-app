"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, AlertTriangle, Monitor } from "lucide-react"
import { ThemeSelect } from "@/components/theme-select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSSE } from "@/hooks/use-sse"


type SSEData = {
  type: string
  endpointId?: string
  status?: string
  slug?: string
  uptime?: number
}

type Endpoint = { id: string; name: string; status: "operational" | "degraded" | "outage" | "up" | "down"; uptime?: number }
type Page = { name: string; slug: string; status: "operational" | "degraded" | "outage"; endpoints: Endpoint[]; daysRetention: number }

export default function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [page, setPage] = useState<Page | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)

  useSSE<SSEData>((data) => {
    if (!page) return

    if (data.type === 'endpoint_update') {
      setPage(prev => {
        if (!prev) return null
        const newEndpoints = prev.endpoints.map(ep => {
          if (ep.id === data.endpointId) {
            return {
              ...ep,
              status: (data.status === 'up' ? 'operational' : 'outage') as Endpoint["status"],
              uptime: data.uptime
            }
          }
          return ep
        })
        return { ...prev, endpoints: newEndpoints }
      })
    }

    if (data.type === 'page_update' && data.slug === slug) {
      setPage(prev => {
        if (!prev) return null
        return { ...prev, status: (data.status || "operational") as Page["status"] }
      })
    }
  })



  useEffect(() => {
    let active = true

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/status-pages/by-slug/${slug}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const mapped: Page = {
          name: data.name,
          slug: data.slug,
          status: (data.status || "operational") as Page["status"],
          daysRetention: data.daysRetention || 90,
          endpoints: (data.endpoints || []).map((e: { id: string; name: string; status: "up" | "down"; uptime?: number }) => ({
            id: e.id,
            name: e.name,
            status: e.status === "up" ? "operational" : e.status === "down" ? "outage" : "operational",
            uptime: e.uptime,
          })),
        }
        if (active) setPage(mapped)
      } catch (error) {
        console.error("Failed to load status page", error)
      } finally {
        if (active) setLoadingPage(false)
      }
    }

    fetchData()
    const interval = setInterval(() => {
      if (active) fetchData()
    }, 60000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [slug])

  const UptimeBar = ({ endpointId }: { endpointId: string }) => {
    const [history, setHistory] = useState<{ date: string; uptime: number; checks: number }[]>([])
    const [retention, setRetention] = useState(page?.daysRetention || 90)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`/api/endpoints/${endpointId}/uptime-history`, { cache: "no-store" })
          if (!res.ok) return
          const data = await res.json()

          const daysRetention = data.daysRetention || page?.daysRetention || 90
          setRetention(daysRetention)

          const historyMap = new Map()
          if (data.history) {
            data.history.forEach((h: { date: string; uptime: number; checks: number }) => historyMap.set(h.date, h))
          }

          const fullHistory = []

          for (let i = daysRetention - 1; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]

            const dayData = historyMap.get(dateStr)

            if (dayData) {
              fullHistory.push(dayData)
            } else {
              fullHistory.push({
                date: dateStr,
                uptime: -1,
                checks: 0
              })
            }
          }

          setHistory(fullHistory)

        } catch (error) {
          console.error("Error fetching uptime history:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchHistory()
      const interval = setInterval(fetchHistory, 300000)
      return () => clearInterval(interval)
    }, [endpointId])

    const getBarColor = (uptime: number, checks: number) => {
      if (checks === 0 || uptime === -1) return 'bg-neutral-200 dark:bg-neutral-800'
      if (uptime >= 99) return 'bg-emerald-400 hover:bg-emerald-500'
      if (uptime >= 95) return 'bg-yellow-400 hover:bg-yellow-500'
      if (uptime >= 1) return 'bg-red-400 hover:bg-red-500'
      return 'bg-neutral-200 dark:bg-neutral-800'
    }

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    if (loading) {
      return (
        <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-sm animate-pulse" />
      )
    }

    const gapClass = retention > 150 ? 'gap-[1px]' : 'gap-[2px]'

    return (
      <div className={`flex ${gapClass} h-full flex-1 items-end w-full`}>
        {history.map((day) => (
          <Tooltip key={day.date} delayDuration={0}>
            <TooltipTrigger asChild>
              <div
                className={`w-full h-full ${getBarColor(day.uptime, day.checks)} transition-colors rounded-sm cursor-help`}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="font-mono z-50">
              <div className="text-center">
                <div className="font-semibold">{formatDate(day.date)}</div>
                {day.uptime !== -1 ? (
                  <>
                    <div className="text-xs opacity-90">
                      {day.uptime.toFixed(2)}% uptime
                    </div>
                    <div className="text-xs opacity-75">
                      {day.checks} check{day.checks !== 1 ? 's' : ''}
                    </div>
                  </>
                ) : (
                  <div className="text-xs opacity-75 italic">
                    No data available
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    )
  }

  if (loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <Monitor className="size-10 text-emerald-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-50 selection:bg-emerald-100 dark:selection:bg-emerald-900/30">
      <nav className="border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-sm">
              <Monitor className="size-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100">
              {page?.name || "Status"}
            </span>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className={`
          relative overflow-hidden rounded-lg p-4 text-left transition-all duration-500
          ${(page?.status || 'operational') === 'operational'
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
            : 'bg-red-500 text-white shadow-md shadow-red-500/10'}
        `}>
          <div className="relative z-10 flex items-center gap-3">
            {(page?.status || 'operational') === 'operational' ? (
              <CheckCircle className="size-5 stroke-2 shrink-0" />
            ) : (
              <AlertTriangle className="size-5 stroke-2 shrink-0" />
            )}
            <h1 className="text-lg font-semibold tracking-tight">
              {(page?.status || 'operational') === 'operational'
                ? 'All systems operational'
                : 'Major outage detected'
              }
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Uptime
            </h2>
            <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Last {page?.daysRetention || 90} days
            </div>
          </div>

          <div className="space-y-6">
            {(page?.endpoints || []).length === 0 ? (
              <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center">
                <Monitor className="size-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">No endpoints configured.</p>
              </div>
            ) : (
              (page?.endpoints || []).map((endpoint: Endpoint) => (
                <div key={endpoint.id} className="group">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="grid gap-0.5">
                      <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        {endpoint.name}
                      </div>
                      <Link
                        href={`#${endpoint.id}`}
                        className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline decoration-emerald-600/30 transition-colors w-fit"
                      >
                        ? incidents
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`relative flex h-2 w-2`}>
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${endpoint.status === 'operational' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${endpoint.status === 'operational' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className={`text-sm font-bold font-mono tracking-tight ${endpoint.status === 'operational' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {endpoint.uptime !== undefined && endpoint.uptime !== null ? `${endpoint.uptime.toFixed(0)}%` : 'No data'}
                      </span>
                    </div>
                  </div>

                  <div className="h-8 w-full bg-neutral-50 dark:bg-neutral-900/50 rounded overflow-hidden ring-1 ring-neutral-100 dark:ring-neutral-800">
                    <UptimeBar endpointId={endpoint.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500"></span>
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-yellow-400"></span>
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500"></span>
              <span>Outage</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-8 mt-auto bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center justify-center sm:justify-start gap-2">
              <Monitor className="size-3.5 text-emerald-500" />
              Powered by SleepComet
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} {page?.name || "Status Page"}. All rights reserved.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Theme</span>
            <ThemeSelect />
          </div>
        </div>
      </footer>
    </div>
  )
}
