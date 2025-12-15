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

const data = {
  user: {
    name: "sleepcomet",
    email: "example@email.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Endpoints",
      url: "/",
      icon: Globe,
      isActive: true,
    },
    {
      title: "Status Pages",
      url: "/status-pages",
      icon: ProportionsIcon,
    },
    {
      title: "Incidents",
      url: "/incidents",
      icon: MessageCircleWarning,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
