"use client"

import * as React from "react"
import Image from "next/image"
import {
  Globe,
  MessageCircleWarning,
  ProportionsIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useActiveIncidents } from "@/hooks/use-active-incidents"

export function AppSidebar({ userPlan = "free", ...props }: React.ComponentProps<typeof Sidebar> & { userPlan?: string }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const activeIncidentsCount = useActiveIncidents()

  const navItems = [
    {
      title: "Endpoints",
      url: "/",
      icon: Globe,
      isActive: true,
    },
    {
      title: "Páginas de Status",
      url: "/status-pages",
      icon: ProportionsIcon,
    },
    {
      title: "Incidentes",
      url: "/incidents",
      icon: MessageCircleWarning,
      badge: activeIncidentsCount,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="">
        {isCollapsed ? (
          <Image src="/icon.svg" alt="Sleepcomet" width={32} height={32} className="invert dark:invert-0" />
        ) : (
          <Image src="/logo.svg" alt="Sleepcomet" width={160} height={40} className="invert dark:invert-0" />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser userPlan={userPlan} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
