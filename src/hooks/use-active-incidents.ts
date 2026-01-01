'use client'

import { useEffect, useState } from 'react'

export function useActiveIncidents() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Initial fetch
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/incidents/count', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setCount(data.count || 0)
      } catch {
        // Silently fail
      }
    }

    fetchCount()

    // Refetch every 30 seconds
    const interval = setInterval(fetchCount, 30000)

    // SSE listener for real-time updates
    const eventSource = new EventSource('/api/sse/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') return

        // Refetch count when incidents are created, resolved, or endpoints deleted
        if (
          data.type === 'incident_created' || 
          data.type === 'incident_resolved' ||
          data.type === 'endpoint_deleted'
        ) {
          fetchCount()
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    return () => {
      clearInterval(interval)
      eventSource.close()
    }
  }, [])

  return count
}
