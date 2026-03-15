"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteGroupDialogProps {
  open: boolean
  groupName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteGroupDialog({ open, groupName, onOpenChange, onConfirm }: DeleteGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Group</DialogTitle>
        </DialogHeader>
        <p className="py-4 text-sm text-muted-foreground">
          Are you sure you want to delete &ldquo;{groupName}&rdquo;? Tabs in this group won&rsquo;t be affected.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
