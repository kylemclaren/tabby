"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteSessionDialogProps {
  open: boolean
  sessionName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteSessionDialog({ open, sessionName, onOpenChange, onConfirm }: DeleteSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Session</DialogTitle>
        </DialogHeader>
        <p className="py-4 text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{sessionName}&rdquo;? This cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
