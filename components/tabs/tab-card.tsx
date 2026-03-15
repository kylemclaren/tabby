"use client"

import { useMemo, useState } from "react"
import type { Tab } from "@/types"
import { FaviconImage } from "@/components/shared/favicon-image"
import { CategoryBadge } from "@/components/shared/category-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CursorPointer01Icon,
  Cancel01Icon,
  SparklesIcon,
  Image01Icon,
  ArrowReloadHorizontalIcon,
  GlassesIcon,
} from "@hugeicons/core-free-icons"
import { isArticleTab } from "@/components/tabs/reader-sheet"

const TWEET_DOMAINS = new Set(["twitter.com", "x.com", "mobile.twitter.com", "mobile.x.com"])

interface TweetData {
  authorName: string
  authorHandle: string
  text: string
  imageUrl: string | null
  avatarUrl?: string | null
}

function parseTweetData(description: string | null): TweetData | null {
  if (!description) return null
  try {
    const data = JSON.parse(description)
    if (data.authorHandle && data.text) return data
    return null
  } catch {
    return null
  }
}

function TweetPreview({ tweet }: { tweet: TweetData }) {
  const [imgError, setImgError] = useState(false)

  // If tweet has an image, use it as the full preview
  if (tweet.imageUrl && !imgError) {
    return (
      <img
        src={tweet.imageUrl}
        alt=""
        className="size-full object-cover"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    )
  }

  // Text-only tweet: render styled card (theme-aware)
  return (
    <div className="flex size-full flex-col justify-center bg-white px-5 py-4 dark:bg-black">
      <div className="mb-2 flex items-center gap-2">
        {tweet.avatarUrl ? (
          <img src={tweet.avatarUrl} alt="" className="size-8 rounded-full" />
        ) : (
          <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-white">
            {tweet.authorName?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">{tweet.authorName}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{tweet.authorHandle}</p>
        </div>
        <svg className="ml-auto size-4 shrink-0 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
      <p className="line-clamp-4 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-100 whitespace-pre-line">
        {tweet.text}
      </p>
    </div>
  )
}

interface TabCardProps {
  tab: Tab
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
  onFocus: (tabId: string) => void
  onClose: (tabId: string) => void
  onClassify: (tabId: string) => void
  onClick: (tab: Tab) => void
  onReopen?: (tabId: string) => void
  onReadArticle?: (tab: Tab) => void
}

function ScreenshotPreview({ tab }: { tab: Tab }) {
  const [error, setError] = useState(false)
  const tweet = useMemo(
    () => (TWEET_DOMAINS.has(tab.domain || "") ? parseTweetData(tab.description) : null),
    [tab.domain, tab.description],
  )

  // Render tweet card
  if (tweet) return <TweetPreview tweet={tweet} />

  // Use OG image if available (works for both open and closed tabs)
  if (tab.ogImage && !error) {
    return (
      <div className="flex size-full items-center justify-center bg-muted/30">
        <img
          src={tab.ogImage}
          alt=""
          className="size-full object-contain"
          loading="lazy"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  if (tab.status !== "open" || error) {
    return (
      <div className="flex items-center justify-center bg-muted/50">
        <HugeiconsIcon icon={Image01Icon} className="size-8 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <img
      src={`/api/tabs/${tab.id}/screenshot`}
      alt=""
      className="size-full object-cover object-top"
      loading="lazy"
      onError={() => setError(true)}
    />
  )
}

export function TabCard({ tab, isSelected, onSelect, onFocus, onClose, onClassify, onClick, onReopen, onReadArticle }: TabCardProps) {
  return (
    <div
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border/60 hover:border-border"
      }`}
      onClick={() => onClick(tab)}
    >
      {/* Screenshot preview */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        <ScreenshotPreview tab={tab} />

        {/* Gradient overlay for hover actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Checkbox — top left */}
        <div
          className="absolute left-3 top-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(tab.id, checked as boolean)}
              className="border-white/60 data-[state=checked]:border-primary shadow-sm"
            />
          </div>
        </div>

        {/* Category badge — top right */}
        {tab.category && (
          <div className="absolute right-3 top-3">
            <CategoryBadge category={tab.category} />
          </div>
        )}

        {/* Hover actions — bottom of screenshot */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-3 py-2.5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {isArticleTab(tab) && onReadArticle && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              onClick={() => onReadArticle(tab)}
              title="Read article"
            >
              <HugeiconsIcon icon={GlassesIcon} className="size-3.5" />
              Read
            </button>
          )}
          {tab.status === "closed" && onReopen && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              onClick={() => onReopen(tab.id)}
              title="Reopen in Chrome"
            >
              <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-3.5" />
              Reopen
            </button>
          )}
          {!tab.category && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              onClick={() => onClassify(tab.id)}
              title="Classify with AI"
            >
              <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
              Classify
            </button>
          )}
          {tab.status === "open" && (
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              onClick={() => onFocus(tab.id)}
              title="Focus in Chrome"
            >
              <HugeiconsIcon icon={CursorPointer01Icon} className="size-3.5" />
              Focus
            </button>
          )}
          {tab.status === "open" && (
            <button
              className="ml-auto inline-flex items-center rounded-lg bg-white/15 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-500/80"
              onClick={() => onClose(tab.id)}
              title="Close tab"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="flex items-start gap-3 p-4">
        <FaviconImage
          url={tab.faviconUrl}
          domain={tab.domain}
          size={24}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold leading-snug">
            {tab.title || tab.url}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {tab.domain || tab.url}
          </p>
          {tab.summary && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
              {tab.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
