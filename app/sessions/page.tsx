"use client"

import { useCallback, useEffect, useState } from "react"
import type { Session } from "@/types"
import { useSyncContext } from "@/components/providers/sync-provider"
import { Header } from "@/components/layout/header"
import { SessionCard } from "@/components/sessions/session-card"
import { SaveSessionDialog } from "@/components/sessions/save-session-dialog"
import { RenameSessionDialog } from "@/components/sessions/rename-session-dialog"
import { DeleteSessionDialog } from "@/components/sessions/delete-session-dialog"
import { ImportSessionButton } from "@/components/sessions/import-session-button"
import { SessionDetailSheet } from "@/components/sessions/session-detail-sheet"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { FloppyDiskIcon } from "@hugeicons/core-free-icons"

export default function SessionsPage() {
  const { lastSync } = useSyncContext()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [saveOpen, setSaveOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Session | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions")
      if (res.ok) setSessions(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions, lastSync])

  const handleSave = useCallback(async (name: string) => {
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    fetchSessions()
  }, [fetchSessions])

  const handleRestore = useCallback(async (id: string) => {
    await fetch(`/api/sessions/${id}/restore`, { method: "POST" })
  }, [])

  const handleExport = useCallback((id: string) => {
    window.open(`/api/sessions/${id}/export`, "_blank")
  }, [])

  const handleRename = useCallback(async (name: string) => {
    if (!renameTarget) return
    await fetch(`/api/sessions/${renameTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setRenameTarget(null)
    fetchSessions()
  }, [renameTarget, fetchSessions])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    await fetch(`/api/sessions/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    fetchSessions()
  }, [deleteTarget, fetchSessions])

  const autoSession = sessions.find((s) => s.isAuto)
  const manualSessions = sessions.filter((s) => !s.isAuto)

  return (
    <>
      <Header title="Sessions" searchValue="" onSearchChange={() => {}}>
        <ImportSessionButton onImport={fetchSessions} />
        <Button onClick={() => setSaveOpen(true)}>
          <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
          Save Session
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Sessions will appear here as Tabby auto-saves your open tabs. You can also save a snapshot manually."
          />
        ) : (
          <div className="space-y-8">
            {/* Auto-saved latest session */}
            {autoSession && (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current Session
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SessionCard
                    session={autoSession}
                    onRestore={handleRestore}
                    onExport={handleExport}
                    onClick={(s) => setDetailId(s.id)}
                  />
                </div>
              </section>
            )}

            {/* Manual sessions */}
            {manualSessions.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Saved Sessions
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {manualSessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onRestore={handleRestore}
                      onExport={handleExport}
                      onRename={(id) => setRenameTarget(sessions.find((x) => x.id === id) || null)}
                      onDelete={(id) => setDeleteTarget(sessions.find((x) => x.id === id) || null)}
                      onClick={(s) => setDetailId(s.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <SaveSessionDialog open={saveOpen} onOpenChange={setSaveOpen} onSave={handleSave} />

      <RenameSessionDialog
        open={!!renameTarget}
        currentName={renameTarget?.name || ""}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onRename={handleRename}
      />

      <DeleteSessionDialog
        open={!!deleteTarget}
        sessionName={deleteTarget?.name || ""}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <SessionDetailSheet
        sessionId={detailId}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onRestore={handleRestore}
        onExport={handleExport}
      />
    </>
  )
}
