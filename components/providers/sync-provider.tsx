"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { SyncResult, ChromeStatus } from "@/types"

interface SyncState {
  lastSync: Date | null
  lastResult: SyncResult | null
  isSyncing: boolean
  chromeStatus: ChromeStatus | null
  triggerSync: () => Promise<void>
}

const SyncContext = createContext<SyncState>({
  lastSync: null,
  lastResult: null,
  isSyncing: false,
  chromeStatus: null,
  triggerSync: async () => {},
})

export function useSyncContext() {
  return useContext(SyncContext)
}

const SYNC_INTERVAL = 30_000

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [lastResult, setLastResult] = useState<SyncResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [chromeStatus, setChromeStatus] = useState<ChromeStatus | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checkChromeStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chrome/status")
      const data: ChromeStatus = await res.json()
      setChromeStatus(data)
      return data.connected
    } catch {
      setChromeStatus({ connected: false, debugUrl: "http://localhost:9222" })
      return false
    }
  }, [])

  const triggerSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/tabs/sync", { method: "POST" })
      if (res.ok) {
        const result: SyncResult = await res.json()
        setLastResult(result)
        setLastSync(new Date())
      }
    } catch {
      // Sync failed silently
    } finally {
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    // Initial check and sync
    checkChromeStatus().then((connected) => {
      if (connected) triggerSync()
    })

    // Set up periodic sync
    intervalRef.current = setInterval(async () => {
      const connected = await checkChromeStatus()
      if (connected) triggerSync()
    }, SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [checkChromeStatus, triggerSync])

  return (
    <SyncContext.Provider value={{ lastSync, lastResult, isSyncing, chromeStatus, triggerSync }}>
      {children}
    </SyncContext.Provider>
  )
}
