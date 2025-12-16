"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, AlertTriangle, Monitor } from "lucide-react"
import { ThemeSelect } from "@/components/theme-select"

type Endpoint = { id: string; name: string; status: "operational" | "degraded" | "outage" | "up" | "down"; uptime?: number }
type Page = { name: string; slug: string; status: "operational" | "degraded" | "outage"; endpoints: Endpoint[] }

export default function PublicStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [page, setPage] = useState<Page | null>(null)
  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch(`/api/status-pages/by-slug/${slug}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const mapped: Page = {
        name: data.name,
        slug: data.slug,
        status: (data.status || "operational") as Page["status"],
        endpoints: (data.endpoints || []).map((e: { id: string; name: string; status: "up" | "down"; uptime?: number }) => ({
          id: e.id,
          name: e.name,
          status: e.status === "up" ? "operational" : e.status === "down" ? "outage" : "operational",
          uptime: e.uptime,
        })),
      }
      if (active) setPage(mapped)
    })()
    return () => { active = false }
  }, [slug])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-emerald-500'
      case 'degraded': return 'text-yellow-500'
      case 'outage': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500'
      case 'degraded': return 'bg-yellow-500'
      case 'outage': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const UptimeBar = () => (
    <div className="flex gap-[2px] h-6 flex-1 items-end">
      {Array.from({ length: 90 }).map((_, i) => (
        <div
          key={i}
          className="w-full h-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors rounded-sm first:rounded-l last:rounded-r"
          title={`Day ${90 - i}: 100% uptime`}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-50">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-4 md:px-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-800 dark:text-neutral-100">
            <Monitor className="size-6" />
            <span>{page?.name || "Status"}</span>
          </div>
          <Link
            href="https://sleepcomet.com"
            className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:px-0 space-y-10">

        {/* Hero Status */}
        <div className={`p-6 rounded-lg shadow-sm flex items-center gap-4 text-white ${getStatusBg(page?.status || 'operational')}`}>
          {(page?.status || 'operational') === 'operational' ? <CheckCircle className="size-8 stroke-[2.5]" /> : <AlertTriangle className="size-8 stroke-[2.5]" />}
          <span className="text-2xl font-bold tracking-tight">
            {(page?.status || 'operational') === 'operational' ? 'All systems operational' : 'Some systems are experiencing issues'}
          </span>
        </div>

        {/* Monitors List */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {(page?.endpoints || []).map((endpoint: Endpoint, index: number) => (
            <div
              key={endpoint.id}
              className={`p-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors ${index !== ((page?.endpoints?.length ?? 0) - 1) ? 'border-b border-neutral-100 dark:border-neutral-800' : ''}`}
            >
              <div className="w-48 font-semibold text-sm text-neutral-700 dark:text-neutral-300 shrink-0">
                {endpoint.name}
              </div>

              <div className="flex-1 hidden md:block select-none">
                <UptimeBar />
              </div>

              <div className={`text-sm font-bold flex items-center gap-2 ${getStatusColor(endpoint.status)} whitespace-nowrap`}>
                {endpoint.status === 'operational' ? 'Operational' : endpoint.status}
              </div>
            </div>
          ))}
        </div>

        {/* Past Incidents (Placeholder) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Past Incidents</h2>
          <div className="text-sm text-neutral-500 dark:text-neutral-400 italic pb-8">
            No incidents reported in the last 90 days.
          </div>
        </div>

      </main>

      <footer className="py-8 border-t border-neutral-100 dark:border-neutral-800 mt-auto bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-400">
            Powered by <a href="https://sleepcomet.com" className="font-semibold text-neutral-600 dark:text-neutral-400 hover:underline">SleepComet</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Theme</span>
            <ThemeSelect />
          </div>
        </div>
      </footer>
    </div>
  )
}
