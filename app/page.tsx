"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Tab } from "@/types"
import { useSyncContext } from "@/components/providers/sync-provider"
import { Header } from "@/components/layout/header"
import { TabGrid } from "@/components/tabs/tab-grid"
import { TabDetailSheet } from "@/components/tabs/tab-detail-sheet"
import { ReaderSheet } from "@/components/tabs/reader-sheet"
import { BulkActionBar } from "@/components/tabs/bulk-action-bar"
import { EmptyState } from "@/components/shared/empty-state"
import { FaviconImage } from "@/components/shared/favicon-image"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon, PencilEdit01Icon, Copy01Icon, SleepingIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

type GroupBy = "window" | "category" | "domain" | "none"

interface TabGroup {
  key: string // raw key for identification (e.g. windowId "1382002407")
  label: string // display label
  editable: boolean
  tabs: Tab[]
}

function groupTabs(
  tabs: Tab[],
  groupBy: GroupBy,
  windowNames: Record<string, string>,
): TabGroup[] {
  if (groupBy === "none") return [{ key: "__all", label: "", editable: false, tabs }]

  const map = new Map<string, Tab[]>()
  const keyOrder: string[] = []
  for (const tab of tabs) {
    let key: string
    switch (groupBy) {
      case "window":
        key = tab.windowId != null ? String(tab.windowId) : "__unknown"
        break
      case "category":
        key = tab.category || "__uncategorized"
        break
      case "domain":
        key = tab.domain || "__unknown"
        break
    }
    const list = map.get(key)
    if (list) {
      list.push(tab)
    } else {
      map.set(key, [tab])
      keyOrder.push(key)
    }
  }

  // For window grouping, assign friendly names
  if (groupBy === "window") {
    let autoIndex = 1
    return keyOrder.map((key) => {
      const tabs = map.get(key)!
      if (key === "__unknown") {
        return { key, label: "Unknown Window", editable: false, tabs }
      }
      const customName = windowNames[key]
      const label = customName || `Window ${autoIndex}`
      autoIndex++
      return { key, label, editable: true, tabs }
    })
  }

  return keyOrder
    .sort((a, b) => {
      if (a.startsWith("__")) return 1
      if (b.startsWith("__")) return -1
      return a.localeCompare(b, undefined, { numeric: true })
    })
    .map((key) => {
      const tabs = map.get(key)!
      const label = key === "__uncategorized" ? "Uncategorized" : key === "__unknown" ? "Unknown" : key
      return { key, label, editable: false, tabs }
    })
}

function EditableGroupHeader({
  group,
  onRename,
}: {
  group: TabGroup
  onRename: (windowId: string, name: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(group.label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(group.label)
  }, [group.label])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== group.label) {
      onRename(group.key, trimmed)
    } else {
      setValue(group.label)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="bg-transparent text-sm font-medium text-muted-foreground outline-none border-b border-muted-foreground/30 focus:border-foreground"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") {
            setValue(group.label)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      className="group/rename flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => setEditing(true)}
    >
      {group.label}
      <HugeiconsIcon
        icon={PencilEdit01Icon}
        className="size-3 opacity-0 group-hover/rename:opacity-60 transition-opacity"
      />
    </button>
  )
}

export default function DashboardPage() {
  const { lastSync, chromeStatus } = useSyncContext()
  const [tabs, setTabs] = useState<Tab[]>([])
  const [search, setSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailTab, setDetailTab] = useState<Tab | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>("window")
  const [windowNames, setWindowNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [classifyingAll, setClassifyingAll] = useState(false)
  const [bulkClassifying, setBulkClassifying] = useState(false)
  const [dupeDialogOpen, setDupeDialogOpen] = useState(false)
  const [dupeInfo, setDupeInfo] = useState<{ duplicates: { url: string; count: number }[]; totalToClose: number } | null>(null)
  const [closingDupes, setClosingDupes] = useState(false)
  const [staleDialogOpen, setStaleDialogOpen] = useState(false)
  const [staleTabs, setStaleTabs] = useState<Tab[]>([])
  const [closingStale, setClosingStale] = useState(false)
  const [closeGroupConfirm, setCloseGroupConfirm] = useState<TabGroup | null>(null)
  const [readerTab, setReaderTab] = useState<Tab | null>(null)

  const fetchTabs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: "open" })
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
  }, [fetchTabs, lastSync])

  // Fetch window names
  useEffect(() => {
    fetch("/api/window-names")
      .then((r) => r.json())
      .then(setWindowNames)
      .catch(() => {})
  }, [])

  const handleRenameWindow = useCallback(async (windowId: string, name: string) => {
    setWindowNames((prev) => ({ ...prev, [windowId]: name }))
    await fetch("/api/window-names", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowId, name }),
    })
  }, [])

  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const handleFocus = useCallback(async (tabId: string) => {
    await fetch("/api/chrome/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabId }),
    })
  }, [])

  const handleClose = useCallback(
    async (tabId: string) => {
      await fetch("/api/chrome/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabId }),
      })
      setTabs((prev) => prev.filter((t) => t.id !== tabId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(tabId)
        return next
      })
      if (detailTab?.id === tabId) setDetailTab(null)
    },
    [detailTab],
  )

  const handleBulkClose = useCallback(async () => {
    const ids = Array.from(selectedIds)
    await Promise.all(
      ids.map((tabId) =>
        fetch("/api/chrome/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabId }),
        }),
      ),
    )
    setTabs((prev) => prev.filter((t) => !selectedIds.has(t.id)))
    setSelectedIds(new Set())
  }, [selectedIds])

  // AI: classify a single tab
  const handleClassify = useCallback(async (tabId: string) => {
    const res = await fetch("/api/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabIds: [tabId] }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.results?.[0]) {
        setTabs((prev) =>
          prev.map((t) => (t.id === data.results[0].id ? { ...t, category: data.results[0].category, isArticle: data.results[0].isArticle } : t)),
        )
      }
    }
  }, [])

  // AI: classify selected tabs
  const handleBulkClassify = useCallback(async () => {
    setBulkClassifying(true)
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabIds: Array.from(selectedIds) }),
      })
      if (res.ok) {
        const data = await res.json()
        const updates = new Map<string, { category: string; isArticle: boolean }>(data.results?.map((r: any) => [r.id, { category: r.category, isArticle: r.isArticle }]) || [])
        setTabs((prev) => prev.map((t) => {
          const u = updates.get(t.id)
          return u ? { ...t, category: u.category, isArticle: u.isArticle } : t
        }))
      }
    } finally {
      setBulkClassifying(false)
    }
  }, [selectedIds])

  // AI: classify all unclassified tabs
  const handleClassifyAll = useCallback(async () => {
    const unclassified = tabs.filter((t) => !t.category)
    if (unclassified.length === 0) return
    setClassifyingAll(true)
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabIds: unclassified.map((t) => t.id) }),
      })
      if (res.ok) {
        const data = await res.json()
        const updates = new Map<string, { category: string; isArticle: boolean }>(data.results?.map((r: any) => [r.id, { category: r.category, isArticle: r.isArticle }]) || [])
        setTabs((prev) => prev.map((t) => {
          const u = updates.get(t.id)
          return u ? { ...t, category: u.category, isArticle: u.isArticle } : t
        }))
      }
    } finally {
      setClassifyingAll(false)
    }
  }, [tabs])

  // Update tab in local state (from detail sheet AI actions)
  const handleTabUpdated = useCallback((updated: Tab) => {
    setTabs((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setDetailTab(updated)
  }, [])

  const handleCheckDuplicates = useCallback(async () => {
    const res = await fetch("/api/chrome/close-duplicates")
    if (res.ok) {
      setDupeInfo(await res.json())
      setDupeDialogOpen(true)
    }
  }, [])

  const handleCloseDuplicates = useCallback(async () => {
    setClosingDupes(true)
    try {
      const res = await fetch("/api/chrome/close-duplicates", { method: "POST" })
      if (res.ok) {
        const { closed } = await res.json()
        toast.success(`Closed ${closed} duplicate tab${closed !== 1 ? "s" : ""}`)
        fetchTabs()
      } else {
        toast.error("Failed to close duplicates")
      }
    } catch {
      toast.error("Failed to close duplicates")
    } finally {
      setClosingDupes(false)
      setDupeDialogOpen(false)
      setDupeInfo(null)
    }
  }, [fetchTabs])

  const handleCheckStale = useCallback(async () => {
    const res = await fetch("/api/tabs/stale?hours=24")
    if (res.ok) {
      const data = await res.json()
      setStaleTabs(data.tabs)
      setStaleDialogOpen(true)
    }
  }, [])

  const handleCloseStale = useCallback(async () => {
    setClosingStale(true)
    try {
      const res = await fetch("/api/tabs/stale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabIds: staleTabs.map((t) => t.id) }),
      })
      if (res.ok) {
        const { closed } = await res.json()
        toast.success(`Suspended ${closed} stale tab${closed !== 1 ? "s" : ""}`)
        fetchTabs()
      } else {
        toast.error("Failed to suspend tabs")
      }
    } catch {
      toast.error("Failed to suspend tabs")
    } finally {
      setClosingStale(false)
      setStaleDialogOpen(false)
      setStaleTabs([])
    }
  }, [staleTabs, fetchTabs])

  const handleConfirmCloseGroup = useCallback(async () => {
    if (!closeGroupConfirm) return
    const openTabs = closeGroupConfirm.tabs.filter((t) => t.status === "open")
    if (openTabs.length === 0) return
    await Promise.all(
      openTabs.map((t) =>
        fetch("/api/chrome/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabId: t.id }),
        })
      ),
    )
    const closedIds = new Set(openTabs.map((t) => t.id))
    setTabs((prev) => prev.filter((t) => !closedIds.has(t.id)))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of closedIds) next.delete(id)
      return next
    })
    toast.success(`Closed ${openTabs.length} tab${openTabs.length !== 1 ? "s" : ""}`)
    setCloseGroupConfirm(null)
  }, [closeGroupConfirm])

  const groups = useMemo(() => groupTabs(tabs, groupBy, windowNames), [tabs, groupBy, windowNames])
  const notConnected = chromeStatus && !chromeStatus.connected
  const hasUnclassified = tabs.some((t) => !t.category)

  return (
    <>
      <Header title="Dashboard" searchValue={search} onSearchChange={setSearch}>
        {tabs.length > 0 && (
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">Group by:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" alignItemWithTrigger={false}>
              <SelectItem value="window">Window</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="domain">Domain</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        )}
        {tabs.length > 0 && (
          <Button variant="outline" onClick={handleCheckStale}>
            <HugeiconsIcon icon={SleepingIcon} className="size-4" />
            Suspend Stale
          </Button>
        )}
        {tabs.length > 0 && (
          <Button variant="outline" onClick={handleCheckDuplicates}>
            <HugeiconsIcon icon={Copy01Icon} className="size-4" />
            Close Dupes
          </Button>
        )}
        {tabs.length > 0 && hasUnclassified && (
          <Button variant="outline" onClick={handleClassifyAll} disabled={classifyingAll}>
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            {classifyingAll ? "Classifying..." : "Classify All"}
          </Button>
        )}
      </Header>

      <div className="flex-1 overflow-y-auto p-8">
        {notConnected ? (
          <EmptyState
            title="Chrome not connected"
            description="Enable remote debugging in your normal Chrome — no restart or separate profile needed."
            action={
              <div className="space-y-2 text-left">
                <div className="rounded-lg bg-muted px-4 py-3 space-y-2">
                  <p className="text-xs font-medium">1. Open this URL in Chrome:</p>
                  <code className="block text-xs">chrome://inspect/#remote-debugging</code>
                  <p className="text-xs font-medium">2. Enable remote debugging and allow connections.</p>
                  <p className="text-xs font-medium">3. Tabby will auto-connect within 30 seconds.</p>
                </div>
              </div>
            }
          />
        ) : loading ? (
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
            title={search ? "No tabs match your search" : "No open tabs found"}
            description={
              search
                ? "Try a different search term."
                : "Open some tabs in Chrome and they'll appear here automatically."
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.key} className="group/section">
                {group.label && (
                  <div className="mb-4 flex items-center gap-3">
                    {group.editable ? (
                      <EditableGroupHeader group={group} onRename={handleRenameWindow} />
                    ) : (
                      <h2 className="text-sm font-medium capitalize text-muted-foreground">
                        {group.label}
                      </h2>
                    )}
                    <span className="text-xs text-muted-foreground/60">
                      {group.tabs.length} {group.tabs.length === 1 ? "tab" : "tabs"}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                    <button
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/section:opacity-100"
                      onClick={() => setCloseGroupConfirm(group)}
                      title={`Close all tabs in ${group.label}`}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                      Close all
                    </button>
                  </div>
                )}
                <TabGrid
                  tabs={group.tabs}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onFocus={handleFocus}
                  onClose={handleClose}
                  onClassify={handleClassify}
                  onTabClick={setDetailTab}
                  onReadArticle={setReaderTab}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <TabDetailSheet
        tab={detailTab}
        open={!!detailTab}
        onOpenChange={(open) => !open && setDetailTab(null)}
        onFocus={handleFocus}
        onClose={handleClose}
        onTabUpdated={handleTabUpdated}
        onReadArticle={(tab) => {
          setDetailTab(null)
          setReaderTab(tab)
        }}
      />

      <ReaderSheet
        tab={readerTab}
        open={!!readerTab}
        onOpenChange={(open) => !open && setReaderTab(null)}
      />

      <BulkActionBar
        count={selectedIds.size}
        onClose={handleBulkClose}
        onClassify={handleBulkClassify}
        onDeselect={() => setSelectedIds(new Set())}
        classifying={bulkClassifying}
      />

      <Dialog open={dupeDialogOpen} onOpenChange={setDupeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Duplicate Tabs</DialogTitle>
          </DialogHeader>
          {dupeInfo && dupeInfo.totalToClose === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No duplicate tabs found.</p>
          ) : dupeInfo ? (
            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{dupeInfo.totalToClose}</span> duplicate{" "}
                tab{dupeInfo.totalToClose !== 1 ? "s" : ""} across{" "}
                <span className="font-medium text-foreground">{dupeInfo.duplicates.length}</span> URL{dupeInfo.duplicates.length !== 1 ? "s" : ""}.
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {dupeInfo.duplicates.map((d) => (
                  <div key={d.url} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground">{d.url}</span>
                    <span className="ml-2 shrink-0 font-medium">{d.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDupeDialogOpen(false)}>Cancel</Button>
            {dupeInfo && dupeInfo.totalToClose > 0 && (
              <Button variant="destructive" onClick={handleCloseDuplicates} disabled={closingDupes}>
                {closingDupes ? "Closing..." : `Close ${dupeInfo.totalToClose} duplicate${dupeInfo.totalToClose !== 1 ? "s" : ""}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={staleDialogOpen} onOpenChange={setStaleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Stale Tabs</DialogTitle>
          </DialogHeader>
          {staleTabs.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No stale tabs found. All tabs have been active in the last 24 hours.</p>
          ) : (
            <div className="py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Found <span className="font-medium text-foreground">{staleTabs.length}</span> tab{staleTabs.length !== 1 ? "s" : ""} inactive for over 24 hours.
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {staleTabs.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                    <FaviconImage url={t.faviconUrl} domain={t.domain} size={14} />
                    <span className="min-w-0 truncate">{t.title || t.url}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground">{t.domain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaleDialogOpen(false)}>Cancel</Button>
            {staleTabs.length > 0 && (
              <Button variant="destructive" onClick={handleCloseStale} disabled={closingStale}>
                {closingStale ? "Suspending..." : `Suspend ${staleTabs.length} tab${staleTabs.length !== 1 ? "s" : ""}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!closeGroupConfirm} onOpenChange={(o) => !o && setCloseGroupConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close All Tabs</DialogTitle>
          </DialogHeader>
          {closeGroupConfirm && (
            <p className="py-4 text-sm text-muted-foreground">
              Close all <span className="font-medium text-foreground">{closeGroupConfirm.tabs.length}</span> tab{closeGroupConfirm.tabs.length !== 1 ? "s" : ""} in &ldquo;{closeGroupConfirm.label}&rdquo;?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseGroupConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmCloseGroup}>
              Close {closeGroupConfirm?.tabs.length} tab{(closeGroupConfirm?.tabs.length ?? 0) !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
