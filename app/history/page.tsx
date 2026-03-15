"use client"

import { useCallback, useEffect, useState } from "react"
import type { Tab } from "@/types"
import { Header } from "@/components/layout/header"
import { TabGrid } from "@/components/tabs/tab-grid"
import { TabDetailSheet } from "@/components/tabs/tab-detail-sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"

export default function HistoryPage() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailTab, setDetailTab] = useState<Tab | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTabs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "closed" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/tabs?${params}`)
      if (res.ok) setTabs(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleReopen = useCallback(
    async (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId)
      if (!tab) return
      try {
        const res = await fetch("/api/chrome/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: tab.url }),
        })
        if (res.ok) {
          toast.success(`Reopened "${tab.title || tab.url}"`)
          setTabs((prev) => prev.filter((t) => t.id !== tabId))
        } else {
          toast.error("Failed to reopen tab")
        }
      } catch {
        toast.error("Failed to reopen tab")
      }
    },
    [tabs],
  )

  return (
    <>
      <Header title="History" searchValue={search} onSearchChange={setSearch} />

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl bg-muted">
                <div className="aspect-[16/10]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted-foreground/10" />
                  <div className="h-3 w-1/2 rounded bg-muted-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        ) : tabs.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Tabs that you close will appear here."
          />
        ) : (
          <TabGrid
            tabs={tabs}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onFocus={handleReopen}
            onClose={() => {}}
            onClassify={() => {}}
            onTabClick={setDetailTab}
            onReopen={handleReopen}
          />
        )}
      </div>

      <TabDetailSheet
        tab={detailTab}
        open={!!detailTab}
        onOpenChange={(open) => !open && setDetailTab(null)}
        onFocus={handleReopen}
        onClose={() => {}}
        onTabUpdated={(t) => { setDetailTab(t); setTabs((prev) => prev.map((x) => x.id === t.id ? t : x)) }}
      />
    </>
  )
}
