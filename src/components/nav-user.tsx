"use client"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { UpgradeToSoloModal } from "@/components/modals/upgrade-to-solo-modal"

import {
  ChevronsUpDown,
  CreditCard,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

export function NavUser({
  user,
}: {
  user?: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { data: session, isPending: isLoading } = authClient.useSession()
  const [isLoggingOut, startLogout] = useTransition()
  const router = useRouter()

  const name = session?.user?.name || user?.name || "User"
  const email = session?.user?.email || user?.email || ""
  const avatar = session?.user?.image || user?.avatar || ""
  const initials = useMemo(() => {
    const fromName = name?.trim().split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join("")
    if (fromName && fromName.length) return fromName
    const fromEmail = email?.split("@")[0]?.slice(0, 2).toUpperCase()
    return fromEmail || "US"
  }, [name, email])

  if (!isLoading && !session && !user) {
    return null
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {isLoading ? (
                  <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-sidebar-accent">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <span className="truncate font-medium">{name}</span>
                      <span className="truncate text-xs">{email}</span>
                    </>
                  )}
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  {isLoading ? (
                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-accent">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={avatar} alt={name} />
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <span className="truncate font-medium">{name}</span>
                        <span className="truncate text-xs">{email}</span>
                      </>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowUpgradeModal(true)}>
                  <Sparkles />
                  Upgrade to Solo
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <CreditCard />
                    Billing
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  if (isLoggingOut) return
                  startLogout(() => {
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          router.replace("/auth/signin")
                          router.refresh()
                        },
                      },
                    })
                  })
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <UpgradeToSoloModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  )
}
