"use client"

import { useState } from "react"
import type { Tab } from "@/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FaviconImage } from "@/components/shared/favicon-image"
import { CategoryBadge } from "@/components/shared/category-badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CursorPointer01Icon,
  Cancel01Icon,
  Clock01Icon,
  Calendar03Icon,
  SparklesIcon,
  GlassesIcon,
} from "@hugeicons/core-free-icons"
import { isArticleTab } from "@/components/tabs/reader-sheet"

interface TabDetailSheetProps {
  tab: Tab | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onFocus: (tabId: string) => void
  onClose: (tabId: string) => void
  onTabUpdated: (tab: Tab) => void
  onReadArticle?: (tab: Tab) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}

export function TabDetailSheet({ tab, open, onOpenChange, onFocus, onClose, onTabUpdated, onReadArticle }: TabDetailSheetProps) {
  const [classifying, setClassifying] = useState(false)
  const [summarizing, setSummarizing] = useState(false)

  if (!tab) return null

  const handleClassify = async () => {
    setClassifying(true)
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabIds: [tab.id] }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.results?.[0]) {
          onTabUpdated({ ...tab, category: data.results[0].category, isArticle: data.results[0].isArticle })
        }
      }
    } finally {
      setClassifying(false)
    }
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabId: tab.id }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.summary) {
          onTabUpdated({ ...tab, summary: data.summary })
        }
      }
    } finally {
      setSummarizing(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <FaviconImage url={tab.faviconUrl} domain={tab.domain} size={40} />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left text-base leading-tight">
                {tab.title || tab.url}
              </SheetTitle>
              <a
                href={tab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-xs text-muted-foreground hover:text-foreground"
              >
                {tab.url}
              </a>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 px-6">
          {/* Chrome Actions */}
          {tab.status === "open" && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onFocus(tab.id)}>
                <HugeiconsIcon icon={CursorPointer01Icon} className="size-4" />
                Focus in Chrome
              </Button>
              <Button
                variant="outline"
                className="flex-1 hover:border-destructive hover:text-destructive"
                onClick={() => onClose(tab.id)}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                Close Tab
              </Button>
            </div>
          )}

          {/* Read Article */}
          {isArticleTab(tab) && onReadArticle && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false)
                onReadArticle(tab)
              }}
            >
              <HugeiconsIcon icon={GlassesIcon} className="size-4" />
              Read Article
            </Button>
          )}

          {/* AI Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClassify}
              disabled={classifying}
            >
              {classifying ? <Spinner /> : <HugeiconsIcon icon={SparklesIcon} className="size-4" />}
              {tab.category ? "Re-classify" : "Classify"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSummarize}
              disabled={summarizing}
            >
              {summarizing ? <Spinner /> : <HugeiconsIcon icon={SparklesIcon} className="size-4" />}
              {tab.summary ? "Re-summarize" : "Summarize"}
            </Button>
          </div>

          <Separator />

          {/* Category */}
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Category
            </h4>
            {tab.category ? (
              <CategoryBadge category={tab.category} />
            ) : (
              <p className="text-sm text-muted-foreground">Not classified</p>
            )}
          </div>

          {/* Summary */}
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Summary
            </h4>
            {tab.summary ? (
              <p className="text-sm leading-relaxed">{tab.summary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No summary yet</p>
            )}
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
                <span>First seen: {formatDate(tab.firstSeenAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                <span>Last seen: {formatDate(tab.lastSeenAt)}</span>
              </div>
              {tab.closedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  <span>Closed: {formatDate(tab.closedAt)}</span>
                </div>
              )}
              {tab.domain && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Domain: {tab.domain}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
