"use client"

import { useEffect, useState } from "react"
import type { SessionWithTabs } from "@/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FaviconImage } from "@/components/shared/favicon-image"
import { CategoryBadge } from "@/components/shared/category-badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowReloadHorizontalIcon, Download04Icon } from "@hugeicons/core-free-icons"

interface SessionDetailSheetProps {
  sessionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore: (id: string) => void
  onExport: (id: string) => void
}

export function SessionDetailSheet({ sessionId, open, onOpenChange, onRestore, onExport }: SessionDetailSheetProps) {
  const [session, setSession] = useState<SessionWithTabs | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId || !open) return
    setLoading(true)
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then(setSession)
      .finally(() => setLoading(false))
  }, [sessionId, open])

  if (!session && !loading) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{session?.name || "Loading..."}</SheetTitle>
          {session && (
            <p className="text-xs text-muted-foreground">
              {session.tabCount} tab{session.tabCount !== 1 ? "s" : ""}
            </p>
          )}
        </SheetHeader>

        {session && (
          <div className="mt-4 flex flex-col gap-4 px-6">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onRestore(session.id)}>
                <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-4" />
                Restore All
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onExport(session.id)}>
                <HugeiconsIcon icon={Download04Icon} className="size-4" />
                Export
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              {session.tabs.map((tab) => (
                <div key={tab.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <FaviconImage url={tab.faviconUrl} domain={tab.domain} size={20} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tab.title || tab.url}</p>
                    <p className="truncate text-xs text-muted-foreground">{tab.domain}</p>
                  </div>
                  {tab.category && <CategoryBadge category={tab.category} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
