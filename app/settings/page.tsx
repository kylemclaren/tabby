"use client"

import { useCallback, useState } from "react"
import { useSyncContext } from "@/components/providers/sync-provider"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { chromeStatus } = useSyncContext()

  const [chromeUrl, setChromeUrl] = useState(chromeStatus?.debugUrl || "http://localhost:9222")
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434")
  const [chromeTestResult, setChromeTestResult] = useState<boolean | null>(null)
  const [chromeError, setChromeError] = useState<string | null>(null)
  const [ollamaTestResult, setOllamaTestResult] = useState<boolean | null>(null)

  const testChrome = useCallback(async () => {
    try {
      const res = await fetch("/api/chrome/status")
      const data = await res.json()
      setChromeTestResult(data.connected)
      setChromeError(data.connected ? null : (data.error ?? null))
    } catch {
      setChromeTestResult(false)
      setChromeError("Failed to reach the status endpoint")
    }
  }, [])

  const testOllama = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/status")
      const data = await res.json()
      setOllamaTestResult(data.connected)
    } catch {
      setOllamaTestResult(false)
    }
  }, [])

  return (
    <>
      <Header title="Settings" searchValue="" onSearchChange={() => {}} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Chrome Connection */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Chrome Connection</h2>
              <p className="text-sm text-muted-foreground">
                Connect to Chrome via the DevTools Protocol for tab management.
              </p>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Debug URL</label>
                <Input
                  value={chromeUrl}
                  onChange={(e) => setChromeUrl(e.target.value)}
                  placeholder="http://localhost:9222"
                />
              </div>
              <Button variant="outline" onClick={testChrome}>
                Test Connection
              </Button>
            </div>

            {chromeTestResult !== null && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <HugeiconsIcon
                    icon={chromeTestResult ? CheckmarkCircle01Icon : Cancel01Icon}
                    className={cn("size-4", chromeTestResult ? "text-green-500" : "text-red-500")}
                  />
                  <span>{chromeTestResult ? "Connected successfully" : "Connection failed"}</span>
                </div>
                {!chromeTestResult && chromeError && (
                  <p className="ml-6 text-xs text-muted-foreground">{chromeError}</p>
                )}
              </div>
            )}

            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-2 text-sm font-medium">How to enable remote debugging</h3>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Chrome 144+ (recommended — uses your normal profile)</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open <code className="rounded bg-background px-1.5 py-0.5">chrome://inspect/#remote-debugging</code> in Chrome</li>
                    <li>Enable remote debugging and allow connections</li>
                    <li>Tabby will auto-connect within 30 seconds</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Ollama */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Ollama (AI Features)</h2>
              <p className="text-sm text-muted-foreground">
                Connect to Ollama for tab classification, summarization, and smart grouping.
              </p>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-sm font-medium">Ollama URL</label>
                <Input
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
              </div>
              <Button variant="outline" onClick={testOllama}>
                Test Connection
              </Button>
            </div>

            {ollamaTestResult !== null && (
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={ollamaTestResult ? CheckmarkCircle01Icon : Cancel01Icon}
                  className={cn("size-4", ollamaTestResult ? "text-green-500" : "text-red-500")}
                />
                <span>{ollamaTestResult ? "Connected successfully" : "Connection failed"}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
