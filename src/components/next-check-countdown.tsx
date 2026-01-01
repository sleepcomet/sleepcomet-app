'use client'

import { useEffect, useState } from 'react'

interface NextCheckCountdownProps {
  lastCheck: string | Date | null | undefined
  checkInterval: number // in seconds
}

export function NextCheckCountdown({ lastCheck, checkInterval }: NextCheckCountdownProps) {
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    const calculateCountdown = () => {
      if (!lastCheck) return checkInterval

      const lastCheckTime = new Date(lastCheck).getTime()
      if (isNaN(lastCheckTime)) return checkInterval

      const now = Date.now()
      const elapsed = Math.floor((now - lastCheckTime) / 1000)
      const remaining = checkInterval - elapsed

      if (remaining <= 0) {
        // If overdue, calculate when it should check next based on interval
        return Math.max(1, checkInterval - (Math.abs(remaining) % checkInterval))
      }
      return remaining
    }

    // Update every second
    const interval = setInterval(() => {
      setCountdown(calculateCountdown())
    }, 1000)

    // Initial calculation after mount
    const frameId = requestAnimationFrame(() => {
      setCountdown(calculateCountdown())
    })

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(frameId)
    }
  }, [lastCheck, checkInterval])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '—'
    
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <span className="font-mono tabular-nums text-muted-foreground">
      {formatTime(countdown)}
    </span>
  )
}
