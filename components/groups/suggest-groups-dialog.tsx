"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FaviconImage } from "@/components/shared/favicon-image"
import { Checkbox } from "@/components/ui/checkbox"

interface Suggestion {
  name: string
  description: string
  tabs: { id: string; title: string | null; url: string }[]
}

interface SuggestGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function SuggestGroupsDialog({ open, onOpenChange, onCreated }: SuggestGroupsDialogProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/suggest-groups", { method: "POST" })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to generate suggestions")
        return
      }
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setSelected(new Set(data.suggestions?.map((_: unknown, i: number) => i) || []))
    } catch {
      setError("Failed to connect to AI")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    for (const idx of selected) {
      const s = suggestions[idx]
      if (!s) continue
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          description: s.description,
          isSmart: true,
          tabIds: s.tabs.map((t) => t.id),
        }),
      })
    }
    setCreating(false)
    setSuggestions([])
    setSelected(new Set())
    onOpenChange(false)
    onCreated()
  }

  const toggleSelection = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSuggestions([])
          setSelected(new Set())
          setError(null)
        }
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Group Suggestions</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto py-4">
          {suggestions.length === 0 && !loading && !error && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Analyze your open tabs and suggest logical groupings.
            </p>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <Spinner />
              <span className="text-sm text-muted-foreground">Analyzing tabs...</span>
            </div>
          )}

          {error && (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 transition-colors cursor-pointer ${
                    selected.has(i) ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => toggleSelection(i)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(i)}
                      onCheckedChange={() => toggleSelection(i)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold">{s.name}</h4>
                      {s.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.tabs.map((tab) => (
                          <div
                            key={tab.id}
                            className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5"
                          >
                            <FaviconImage
                              url={null}
                              domain={(() => { try { return new URL(tab.url).hostname } catch { return null } })()}
                              size={12}
                            />
                            <span className="max-w-28 truncate text-[11px]">
                              {tab.title || tab.url}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          {suggestions.length === 0 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "Analyzing..." : "Suggest Groups"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                Regenerate
              </Button>
              <Button onClick={handleCreate} disabled={selected.size === 0 || creating}>
                {creating ? "Creating..." : `Create ${selected.size} Group${selected.size !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
