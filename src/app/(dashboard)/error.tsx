"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-bold">Algo deu errado</h2>
        <p className="text-muted-foreground">
          Ocorreu um erro ao carregar o dashboard.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto">
            {error.message}
          </pre>
        )}
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </div>
  )
}
