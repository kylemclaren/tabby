"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SaveSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
}

export function SaveSessionDialog({ open, onOpenChange, onSave }: SaveSessionDialogProps) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim())
    setSaving(false)
    setName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Current Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label className="mb-1.5 block text-sm font-medium">Session name</label>
          <Input
            placeholder="e.g. Work tabs Friday"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
