"use client"

import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Cancel02Icon, SparklesIcon } from "@hugeicons/core-free-icons"

interface BulkActionBarProps {
  count: number
  onClose: () => void
  onClassify: () => void
  onDeselect: () => void
  classifying?: boolean
}

export function BulkActionBar({ count, onClose, onClassify, onDeselect, classifying }: BulkActionBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit animate-in slide-in-from-bottom-4 items-center gap-3 rounded-2xl border bg-card px-6 py-3 shadow-xl">
      <span className="text-sm font-medium">{count} tab{count !== 1 ? "s" : ""} selected</span>
      <div className="h-5 w-px bg-border" />
      <Button variant="outline" size="sm" onClick={onClassify} disabled={classifying}>
        <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
        {classifying ? "Classifying..." : "Classify"}
      </Button>
      <Button variant="outline" size="sm" onClick={onClose}>
        <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        Close in Chrome
      </Button>
      <Button variant="ghost" size="sm" onClick={onDeselect}>
        <HugeiconsIcon icon={Cancel02Icon} className="size-3.5" />
        Deselect
      </Button>
    </div>
  )
}
