"use client"

import { useCallback, useEffect, useState } from "react"
import type { Group } from "@/types"
import { Header } from "@/components/layout/header"
import { GroupCard } from "@/components/groups/group-card"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { RenameGroupDialog } from "@/components/groups/rename-group-dialog"
import { DeleteGroupDialog } from "@/components/groups/delete-group-dialog"
import { GroupDetailSheet } from "@/components/groups/group-detail-sheet"
import { SuggestGroupsDialog } from "@/components/groups/suggest-groups-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, SparklesIcon } from "@hugeicons/core-free-icons"

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null)
  const [detailGroup, setDetailGroup] = useState<Group | null>(null)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/groups")
      if (res.ok) setGroups(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleCreate = useCallback(
    async (name: string, description: string) => {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      })
      fetchGroups()
    },
    [fetchGroups],
  )

  const handleRename = useCallback(
    async (name: string) => {
      if (!renameTarget) return
      await fetch(`/api/groups/${renameTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      setRenameTarget(null)
      fetchGroups()
    },
    [renameTarget, fetchGroups],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    await fetch(`/api/groups/${deleteTarget.id}`, { method: "DELETE" })
    setDeleteTarget(null)
    if (detailGroup?.id === deleteTarget.id) setDetailGroup(null)
    fetchGroups()
  }, [deleteTarget, detailGroup, fetchGroups])

  const filtered = search
    ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : groups

  return (
    <>
      <Header title="Groups" searchValue={search} onSearchChange={setSearch}>
        <Button variant="outline" onClick={() => setSuggestOpen(true)}>
          <HugeiconsIcon icon={SparklesIcon} className="size-4" />
          AI Suggest
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          New Group
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No groups match your search" : "No groups yet"}
            description={
              search
                ? "Try a different search term."
                : "Create groups to organize your tabs, or let AI suggest groupings."
            }
            action={
              !search ? (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSuggestOpen(true)}>
                    <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                    AI Suggest
                  </Button>
                  <Button onClick={() => setCreateOpen(true)}>
                    <HugeiconsIcon icon={Add01Icon} className="size-4" />
                    New Group
                  </Button>
                </div>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={setDetailGroup}
                onRename={setRenameTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />

      <RenameGroupDialog
        open={!!renameTarget}
        currentName={renameTarget?.name || ""}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onRename={handleRename}
      />

      <DeleteGroupDialog
        open={!!deleteTarget}
        groupName={deleteTarget?.name || ""}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <GroupDetailSheet
        group={detailGroup}
        open={!!detailGroup}
        onOpenChange={(open) => !open && setDetailGroup(null)}
        onUpdated={fetchGroups}
      />

      <SuggestGroupsDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        onCreated={fetchGroups}
      />
    </>
  )
}
