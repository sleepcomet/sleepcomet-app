"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/lib/utils"

interface FadeInProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  y?: number
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  y = 5,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
      )
    },
    { scope: ref }
  )

  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  )
}
