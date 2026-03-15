"use client"

import type { Group } from "@/types"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, Delete02Icon } from "@hugeicons/core-free-icons"

interface GroupCardProps {
  group: Group
  onClick: (group: Group) => void
  onRename: (group: Group) => void
  onDelete: (group: Group) => void
}

const COLOR_DOTS: Record<string, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  cyan: "bg-cyan-500",
}

export function GroupCard({ group, onClick, onRename, onDelete }: GroupCardProps) {
  const dotColor = COLOR_DOTS[group.color || ""] || "bg-muted-foreground"

  return (
    <div
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-5 transition-all hover:shadow-md"
      onClick={() => onClick(group)}
    >
      <div
        className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onRename(group)}
          title="Rename"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 hover:text-destructive"
          onClick={() => onDelete(group)}
          title="Delete"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <div className={`size-2.5 rounded-full ${dotColor}`} />
          <h3 className="text-sm font-semibold">{group.name}</h3>
          {group.isSmart && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Smart
            </span>
          )}
        </div>
        {group.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {group.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {group.tabCount ?? 0} tab{(group.tabCount ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}
