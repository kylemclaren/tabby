"use client"

import type { Session } from "@/types"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowReloadHorizontalIcon,
  Download04Icon,
  PencilEdit01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"

interface SessionCardProps {
  session: Session
  onRestore: (id: string) => void
  onExport: (id: string) => void
  onRename?: (id: string) => void
  onDelete?: (id: string) => void
  onClick: (session: Session) => void
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function SessionCard({ session, onRestore, onExport, onRename, onDelete, onClick }: SessionCardProps) {
  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-5 transition-all hover:shadow-md"
      onClick={() => onClick(session)}
    >
      {/* Actions */}
      <div
        className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onRestore(session.id)} title="Restore session">
          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onExport(session.id)} title="Export session">
          <HugeiconsIcon icon={Download04Icon} className="size-4" />
        </Button>
        {!session.isAuto && onRename && (
          <Button variant="ghost" size="icon" className="size-8" onClick={() => onRename(session.id)} title="Rename">
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
        )}
        {!session.isAuto && onDelete && (
          <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" onClick={() => onDelete(session.id)} title="Delete">
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{session.name}</h3>
          {session.isAuto && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Auto-saved
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {session.tabCount} tab{session.tabCount !== 1 ? "s" : ""} · Updated {timeAgo(session.updatedAt)}
        </p>
      </div>
    </div>
  )
}
