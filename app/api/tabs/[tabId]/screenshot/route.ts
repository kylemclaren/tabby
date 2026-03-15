import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { captureScreenshot } from "@/lib/chrome/cdp"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

const SCREENSHOT_DIR = path.join(process.cwd(), "data", "screenshots")

function jpegResponse(data: Buffer | Uint8Array, maxAge: number) {
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": `public, max-age=${maxAge}`,
    },
  })
}

function ensureDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
}

function screenshotPath(tabId: string) {
  return path.join(SCREENSHOT_DIR, `${tabId}.jpg`)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tabId: string }> },
) {
  const { tabId } = await params
  const { searchParams } = request.nextUrl
  const refresh = searchParams.get("refresh") === "1"

  ensureDir()
  const filePath = screenshotPath(tabId)

  // Serve cached screenshot if fresh enough (< 5 min) and not forcing refresh
  if (!refresh && fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath)
    const ageMs = Date.now() - stat.mtimeMs
    if (ageMs < 5 * 60 * 1000) {
      return jpegResponse(fs.readFileSync(filePath), 300)
    }
  }

  // Look up tab to get chromeId
  const db = await getDb()
  const tab = db.select().from(tabs).where(eq(tabs.id, tabId)).get()

  // If tab has an OG image, redirect to it
  if (tab?.ogImage) {
    return NextResponse.redirect(tab.ogImage, { status: 302 })
  }

  if (!tab || !tab.chromeId || tab.status !== "open") {
    // Serve stale cached version if available
    if (fs.existsSync(filePath)) {
      return jpegResponse(fs.readFileSync(filePath), 60)
    }
    return NextResponse.json({ error: "Tab not available" }, { status: 404 })
  }

  try {
    const buffer = await captureScreenshot(tab.chromeId)
    fs.writeFileSync(filePath, buffer)
    return jpegResponse(buffer, 300)
  } catch (error) {
    // Serve stale cached version on error
    if (fs.existsSync(filePath)) {
      return jpegResponse(fs.readFileSync(filePath), 60)
    }
    const message = error instanceof Error ? error.message : "Screenshot failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
