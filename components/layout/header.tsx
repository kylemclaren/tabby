"use client"

import { useSyncContext } from "@/components/providers/sync-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface HeaderProps {
  title: string
  searchValue: string
  onSearchChange: (value: string) => void
  children?: React.ReactNode
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return "just now"
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

export function Header({ title, searchValue, onSearchChange, children }: HeaderProps) {
  const { lastSync, isSyncing, triggerSync } = useSyncContext()

  return (
    <header className="flex items-center gap-4 border-b px-8 py-4">
      <h1 className="text-xl font-bold">{title}</h1>

      {/* Sync status */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={triggerSync}
          disabled={isSyncing}
        >
          <HugeiconsIcon
            icon={ArrowReloadHorizontalIcon}
            className={cn("size-3.5", isSyncing && "animate-spin")}
          />
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isSyncing ? (
            <>
              <div className="size-1.5 animate-pulse rounded-full bg-amber-500" />
              Syncing...
            </>
          ) : lastSync ? (
            <>
              <div className="size-1.5 rounded-full bg-green-500" />
              Synced {timeAgo(lastSync)}
            </>
          ) : (
            <>
              <div className="size-1.5 rounded-full bg-muted-foreground" />
              Not synced
            </>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search tabs..."
            className="w-64 pl-9"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {children}
      </div>
    </header>
  )
}
