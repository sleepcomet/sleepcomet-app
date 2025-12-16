"use client"

import Script from "next/script"

export function UmamiAnalytics() {
  if (process.env.NODE_ENV !== "production") return null

  return (
    <Script
      src="https://cloud.umami.is/script.js"
      data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  )
}
