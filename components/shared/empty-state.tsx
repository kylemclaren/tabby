import { HugeiconsIcon } from "@hugeicons/react"
import { BrowserIcon } from "@hugeicons/core-free-icons"

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="rounded-2xl bg-muted p-6">
        <HugeiconsIcon icon={BrowserIcon} className="size-12 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
