'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

type Endpoint = {
  id: string
  name: string
  url: string
  status: 'up' | 'down'
  uptime?: number
  lastCheck?: string
  checkInterval?: number
  metrics?: any
}

async function fetchEndpoint(id: string): Promise<Endpoint> {
  const res = await fetch(`/api/endpoints/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch endpoint')
  return res.json()
}

async function fetchEndpoints(): Promise<Endpoint[]> {
  const res = await fetch('/api/endpoints', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch endpoints')
  return res.json()
}

export function useEndpoint(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['endpoint', id],
    queryFn: () => fetchEndpoint(id),
  })

  // SSE listener for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/sse/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') return

        if (data.type === 'endpoint_update' && data.endpointId === id) {
          // Update the cache with new data
          queryClient.setQueryData(['endpoint', id], (old: Endpoint | undefined) => {
            if (!old) return old
            return {
              ...old,
              status: data.status,
              uptime: data.uptime,
              lastCheck: data.lastCheck || new Date().toISOString(),
            }
          })
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    eventSource.onerror = () => {
      // Will auto-reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [id, queryClient])

  return query
}

export function useEndpoints() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['endpoints'],
    queryFn: fetchEndpoints,
  })

  // SSE listener for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/sse/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') return

        if (data.type === 'endpoint_update') {
          // Update the endpoints list cache
          queryClient.setQueryData(['endpoints'], (old: Endpoint[] | undefined) => {
            if (!old) return old
            return old.map(ep => {
              if (ep.id === data.endpointId) {
                return {
                  ...ep,
                  status: data.status,
                  uptime: data.uptime,
                  last_check: data.lastCheck || new Date().toISOString(),
                }
              }
              return ep
            })
          })

          // Also update individual endpoint cache if it exists
          queryClient.setQueryData(['endpoint', data.endpointId], (old: Endpoint | undefined) => {
            if (!old) return old
            return {
              ...old,
              status: data.status,
              uptime: data.uptime,
              lastCheck: data.lastCheck || new Date().toISOString(),
            }
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

  return query
}
