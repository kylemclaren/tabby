"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useSyncContext } from "@/components/providers/sync-provider"
import { ThemeToggle } from "./theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Clock01Icon,
  Layers01Icon,
  FolderLibraryIcon,
  Settings01Icon,
  SidebarLeft01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { TabbyLogo } from "./tabby-logo"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home01Icon },
  { href: "/history", label: "History", icon: Clock01Icon },
  { href: "/sessions", label: "Sessions", icon: Layers01Icon },
  { href: "/groups", label: "Groups", icon: FolderLibraryIcon },
  { href: "/settings", label: "Settings", icon: Settings01Icon },
]

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "true")
    setMounted(true)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("sidebar-collapsed", String(next))
      return next
    })
  }, [])

  return { collapsed, toggle, mounted }
}

function NavLink({
  href,
  icon,
  label,
  isActive,
  collapsed,
}: {
  href: string
  icon: typeof Home01Icon
  label: string
  isActive: boolean
  collapsed: boolean
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center size-10" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <HugeiconsIcon icon={icon} className="size-[18px] shrink-0" />
      {!collapsed && label}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Link href={href} />}
        className={cn(
          "flex items-center justify-center size-10 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <HugeiconsIcon icon={icon} className="size-[18px] shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { chromeStatus, lastResult } = useSyncContext()
  const { collapsed, toggle, mounted } = useCollapsed()

  const openCount = lastResult?.total ?? 0

  // Cmd/Ctrl+B to toggle
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [toggle])

  // Prevent layout flash before mount
  if (!mounted) {
    return <aside className="flex h-svh w-64 shrink-0 flex-col border-r bg-sidebar" />
  }

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "flex h-svh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        {/* Logo + toggle */}
        <div className={cn("flex items-center pt-6 pb-4", collapsed ? "justify-center px-3" : "gap-2.5 px-5")}>
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
            <TabbyLogo className="size-6" />
          </div>
          {!collapsed && (
            <>
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">Tabby</span>
              <button
                className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                onClick={toggle}
                title="Collapse sidebar (⌘B)"
              >
                <HugeiconsIcon icon={SidebarLeft01Icon} className="size-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex flex-col gap-1 py-2", collapsed ? "items-center px-2" : "px-3")}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center px-2 pt-1">
            <Tooltip>
              <TooltipTrigger
                className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                onClick={toggle}
              >
                <HugeiconsIcon icon={SidebarLeft01Icon} className="size-4 rotate-180" />
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar (⌘B)</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Bottom status */}
        <div className={cn("mt-auto border-t py-4", collapsed ? "flex flex-col items-center gap-3 px-2" : "flex flex-col gap-3 px-4")}>
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger className="flex items-center justify-center">
                  <div
                    className={cn(
                      "size-2.5 rounded-full",
                      chromeStatus?.connected ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">
                  {chromeStatus?.connected ? "Chrome connected" : "Chrome disconnected"}
                  {openCount > 0 && ` · ${openCount} tab${openCount !== 1 ? "s" : ""}`}
                </TooltipContent>
              </Tooltip>
              <ThemeToggle />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                  <div
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      chromeStatus?.connected ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span className="text-muted-foreground">
                    {chromeStatus?.connected ? "Chrome connected" : "Chrome disconnected"}
                  </span>
                </div>
                <ThemeToggle />
              </div>

              {openCount > 0 && (
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {openCount} open tab{openCount !== 1 ? "s" : ""}
                </p>
              )}
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
