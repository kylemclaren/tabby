"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import type { Tab, Session, Group } from "@/types"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { FaviconImage } from "@/components/shared/favicon-image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  Clock01Icon,
  Layers01Icon,
  FolderLibraryIcon,
  Settings01Icon,
  Sun03Icon,
  SparklesIcon,
  FloppyDiskIcon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [closedTabs, setClosedTabs] = useState<Tab[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()

  const saveSession = useCallback(() => {
    const name = `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then(() => toast.success("Session saved"))
      .catch(() => toast.error("Failed to save session"))
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        saveSession()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [saveSession])

  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch("/api/tabs?status=open").then((r) => r.json()).catch(() => []),
      fetch("/api/tabs?status=closed").then((r) => r.json()).catch(() => []),
      fetch("/api/sessions").then((r) => r.json()).catch(() => []),
      fetch("/api/groups").then((r) => r.json()).catch(() => []),
    ]).then(([openTabs, closed, sess, grps]) => {
      setTabs(openTabs)
      setClosedTabs(closed)
      setSessions(sess)
      setGroups(grps)
    })
  }, [open])

  const run = useCallback((fn: () => void) => {
    setOpen(false)
    fn()
  }, [])

  const handleReopen = useCallback((tab: Tab) => {
    setOpen(false)
    fetch("/api/chrome/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tab.url }),
    }).then(() => toast.success(`Reopened "${tab.title || tab.url}"`))
      .catch(() => toast.error("Failed to reopen tab"))
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tabs, history, sessions, groups..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {tabs.length > 0 && (
          <CommandGroup heading="Open Tabs">
            {tabs.slice(0, 8).map((tab) => (
              <CommandItem
                key={tab.id}
                value={`open ${tab.title} ${tab.url} ${tab.domain}`}
                onSelect={() => {
                  setOpen(false)
                  fetch("/api/chrome/focus", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tabId: tab.id }),
                  })
                }}
              >
                <FaviconImage url={tab.faviconUrl} domain={tab.domain} size={16} />
                <span className="truncate">{tab.title || tab.url}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground max-w-32">
                  {tab.domain}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {closedTabs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="History">
              {closedTabs.slice(0, 6).map((tab) => (
                <CommandItem
                  key={tab.id}
                  value={`history ${tab.title} ${tab.url} ${tab.domain}`}
                  onSelect={() => handleReopen(tab)}
                >
                  <FaviconImage url={tab.faviconUrl} domain={tab.domain} size={16} />
                  <span className="truncate">{tab.title || tab.url}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <HugeiconsIcon icon={ArrowReloadHorizontalIcon} className="size-3" />
                    Reopen
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {sessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Sessions">
              {sessions.slice(0, 5).map((session) => (
                <CommandItem
                  key={session.id}
                  value={`session ${session.name}`}
                  onSelect={() => run(() => router.push(`/sessions`))}
                >
                  <HugeiconsIcon icon={Layers01Icon} className="size-4" />
                  <span className="truncate">{session.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {session.tabCount} tab{session.tabCount !== 1 ? "s" : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {groups.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Groups">
              {groups.slice(0, 5).map((group) => (
                <CommandItem
                  key={group.id}
                  value={`group ${group.name} ${group.description || ""}`}
                  onSelect={() => run(() => router.push(`/groups`))}
                >
                  <HugeiconsIcon icon={FolderLibraryIcon} className="size-4" />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {group.tabCount ?? 0} tab{(group.tabCount ?? 0) !== 1 ? "s" : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false)
              const unclassified = tabs.filter((t) => !t.category)
              if (unclassified.length === 0) return
              fetch("/api/ai/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tabIds: unclassified.map((t) => t.id) }),
              })
            }}
          >
            <HugeiconsIcon icon={SparklesIcon} className="size-4" />
            Classify all tabs with AI
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              saveSession()
            }}
          >
            <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
            Save current session
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
            <HugeiconsIcon icon={Sun03Icon} className="size-4" />
            Toggle theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => run(() => router.push("/"))}>
            <HugeiconsIcon icon={Home01Icon} className="size-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/history"))}>
            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
            History
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/sessions"))}>
            <HugeiconsIcon icon={Layers01Icon} className="size-4" />
            Sessions
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/groups"))}>
            <HugeiconsIcon icon={FolderLibraryIcon} className="size-4" />
            Groups
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/settings"))}>
            <HugeiconsIcon icon={Settings01Icon} className="size-4" />
            Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
