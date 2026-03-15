"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RenameSessionDialogProps {
  open: boolean
  currentName: string
  onOpenChange: (open: boolean) => void
  onRename: (name: string) => void
}

export function RenameSessionDialog({ open, currentName, onOpenChange, onRename }: RenameSessionDialogProps) {
  const [name, setName] = useState(currentName)

  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const handleRename = async () => {
    if (!name.trim()) return
    await onRename(name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRename} disabled={!name.trim()}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
