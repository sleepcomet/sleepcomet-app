"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      Sentry.captureException(error)
    }
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md border-destructive/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="size-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl">Something went wrong!</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>A critical error occurred. Please try refreshing the page.</p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={() => reset()} variant="default" className="gap-2">
                <RefreshCw className="size-4" />
                Refresh Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  )
}
