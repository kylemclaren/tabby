"use client"

import { useCallback, useEffect, useState } from "react"
import type { Tab } from "@/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { FaviconImage } from "@/components/shared/favicon-image"
import { Spinner } from "@/components/ui/spinner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, SparklesIcon, MinusSignIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

const FONT_SIZES = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"] as const
const HEADING_SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"] as const
const DEFAULT_SIZE_INDEX = 1

interface ReaderSheetProps {
  tab: Tab | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ArticleData {
  title: string
  siteName: string | null
  content: string
  url: string
  summary: string | null
}

export function ReaderSheet({ tab, open, onOpenChange }: ReaderSheetProps) {
  const [article, setArticle] = useState<ArticleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(true)
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX)

  const fetchArticle = useCallback(async (tabId: string) => {
    setLoading(true)
    setError(null)
    setArticle(null)
    try {
      const res = await fetch(`/api/tabs/${tabId}/reader`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to load article")
        return
      }
      setArticle(await res.json())
    } catch {
      setError("Failed to load article")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && tab) {
      fetchArticle(tab.id)
    }
    if (!open) {
      setArticle(null)
      setError(null)
    }
  }, [open, tab, fetchArticle])

  if (!tab) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start gap-3">
            <FaviconImage url={tab.faviconUrl} domain={tab.domain} size={32} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left text-base leading-tight">
                {article?.title || tab.title || tab.url}
              </SheetTitle>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {article?.siteName && (
                  <>
                    <span>{article.siteName}</span>
                    <span>·</span>
                  </>
                )}
                <a
                  href={tab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-foreground"
                >
                  {tab.domain}
                </a>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 px-6">
          {/* Text size controls */}
          <div className="flex items-center justify-end gap-1">
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
              disabled={sizeIndex === 0}
              title="Smaller text"
            >
              <HugeiconsIcon icon={MinusSignIcon} className="size-4" />
            </button>
            <span className="w-8 text-center text-xs text-muted-foreground">{["XS", "S", "M", "L", "XL"][sizeIndex]}</span>
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
              onClick={() => setSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
              disabled={sizeIndex === FONT_SIZES.length - 1}
              title="Larger text"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            </button>
          </div>

          {/* Collapsible AI Summary */}
          {(tab.summary || article?.summary) && (
            <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/60 px-4 py-3 text-left transition-colors hover:bg-muted">
                <HugeiconsIcon icon={SparklesIcon} className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">AI Summary</span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={`size-4 text-muted-foreground transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="px-4 pt-3 pb-1 text-sm leading-relaxed text-muted-foreground">
                  {article?.summary || tab.summary}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Article Content */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-6" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {article && (
            <article className={`max-w-none pb-8 text-foreground/90 ${FONT_SIZES[sizeIndex]}`}>
              {article.content.split("\n\n").map((paragraph, i) => {
                const trimmed = paragraph.trim()
                if (!trimmed) return null

                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={i} className={`mt-6 mb-3 font-semibold text-foreground ${HEADING_SIZES[sizeIndex]}`}>
                      {trimmed.slice(3)}
                    </h2>
                  )
                }

                if (trimmed.startsWith("- ")) {
                  const items = trimmed.split("\n").filter((l) => l.trim().startsWith("- "))
                  return (
                    <ul key={i} className="my-2 ml-4 list-disc space-y-1 text-foreground/80">
                      {items.map((item, j) => (
                        <li key={j}>{item.slice(2).trim()}</li>
                      ))}
                    </ul>
                  )
                }

                return (
                  <p key={i} className="my-3 leading-relaxed">
                    {trimmed}
                  </p>
                )
              })}
            </article>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function isArticleTab(tab: Tab): boolean {
  return tab.isArticle === true
}
