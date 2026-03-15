import type { ChromeTab } from "@/types"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"

const CHROME_PROFILE_DIR =
  process.env.CHROME_PROFILE_DIR ||
  path.join(os.homedir(), "Library", "Application Support", "Google", "Chrome")
const DEVTOOLS_PORT_FILE =
  process.env.DEVTOOLS_PORT_FILE || path.join(CHROME_PROFILE_DIR, "DevToolsActivePort")
const WS_HOST = process.env.CHROME_WS_HOST || "127.0.0.1"

function readDevToolsPort(): { port: number; wsPath: string } {
  const content = fs.readFileSync(DEVTOOLS_PORT_FILE, "utf8")
  const [rawPort, rawPath] = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  const port = parseInt(rawPort, 10)
  if (!port || !rawPath) throw new Error("Invalid DevToolsActivePort file")
  return { port, wsPath: rawPath }
}

// Persistent connection — one WebSocket, one "Allow" prompt
let _ws: WebSocket | null = null
let _wsReady: Promise<WebSocket> | null = null
let _cdpId = 0

function getConnection(): Promise<WebSocket> {
  if (_ws && _ws.readyState === WebSocket.OPEN) return Promise.resolve(_ws)

  if (_wsReady) return _wsReady

  _wsReady = new Promise<WebSocket>((resolve, reject) => {
    const { port, wsPath } = readDevToolsPort()
    const url = `ws://${WS_HOST}:${port}${wsPath}`
    const ws = new WebSocket(url)

    const timeout = setTimeout(() => {
      ws.close()
      _wsReady = null
      reject(new Error("WebSocket connection timeout"))
    }, 10000)

    ws.addEventListener("open", () => {
      clearTimeout(timeout)
      _ws = ws
      _wsReady = null
      resolve(ws)
    })

    ws.addEventListener("close", () => {
      _ws = null
      _wsReady = null
    })

    ws.addEventListener("error", () => {
      clearTimeout(timeout)
      _ws = null
      _wsReady = null
      reject(new Error("WebSocket connection failed"))
    })
  })

  return _wsReady
}

function cdpCommand(ws: WebSocket, method: string, params: Record<string, unknown> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++_cdpId
    const timeout = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 5000)

    const handler = (event: MessageEvent) => {
      const data = JSON.parse(event.data as string)
      if (data.id === id) {
        ws.removeEventListener("message", handler)
        clearTimeout(timeout)
        if (data.error) reject(new Error(data.error.message))
        else resolve(data.result)
      }
    }

    ws.addEventListener("message", handler)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function cdp(method: string, params: Record<string, unknown> = {}): Promise<any> {
  const ws = await getConnection()
  return cdpCommand(ws, method, params)
}

export async function listTabs(): Promise<ChromeTab[]> {
  const result = await cdp("Target.getTargets")
  const pages = (result.targetInfos || []).filter((t: any) => t.type === "page")

  // Fetch window IDs for all tabs in parallel
  const ws = await getConnection()
  const windowResults = await Promise.allSettled(
    pages.map((t: any) =>
      cdpCommand(ws, "Browser.getWindowForTarget", { targetId: t.targetId })
    )
  )

  return pages.map((t: any, i: number) => ({
    id: t.targetId,
    type: t.type,
    title: t.title,
    url: t.url,
    faviconUrl: t.faviconUrl || null,
    windowId: windowResults[i].status === "fulfilled" ? windowResults[i].value.windowId : null,
  }))
}

export async function closeTab(chromeId: string): Promise<void> {
  await cdp("Target.closeTarget", { targetId: chromeId })
}

export async function focusTab(chromeId: string): Promise<void> {
  await cdp("Target.activateTarget", { targetId: chromeId })
}

export async function openTab(url: string): Promise<ChromeTab> {
  const result = await cdp("Target.createTarget", { url })
  return { id: result.targetId, type: "page", title: url, url }
}

export async function captureScreenshot(chromeId: string): Promise<Buffer> {
  const ws = await getConnection()

  // Attach to the target to get a session
  const { sessionId } = await cdpCommand(ws, "Target.attachToTarget", {
    targetId: chromeId,
    flatten: true,
  })

  try {
    // Capture screenshot via the session
    const result = await new Promise<any>((resolve, reject) => {
      const id = ++_cdpId
      const timeout = setTimeout(() => reject(new Error("Screenshot timeout")), 10000)

      const handler = (event: MessageEvent) => {
        const data = JSON.parse(event.data as string)
        if (data.id === id) {
          ws.removeEventListener("message", handler)
          clearTimeout(timeout)
          if (data.error) reject(new Error(data.error.message))
          else resolve(data.result)
        }
      }

      ws.addEventListener("message", handler)
      ws.send(
        JSON.stringify({
          id,
          method: "Page.captureScreenshot",
          params: { format: "jpeg", quality: 70 },
          sessionId,
        }),
      )
    })

    return Buffer.from(result.data, "base64")
  } finally {
    // Always detach
    try {
      await cdpCommand(ws, "Target.detachFromTarget", { sessionId })
    } catch {
      // ignore detach errors
    }
  }
}

export async function getChromeStatus(): Promise<{
  connected: boolean
  browser?: string
  version?: string
  error?: string
}> {
  try {
    const result = await cdp("Browser.getVersion")
    return {
      connected: true,
      browser: result.product,
      version: result.protocolVersion,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return { connected: false, error: msg }
  }
}
