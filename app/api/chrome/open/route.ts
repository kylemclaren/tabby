import { openTab } from "@/lib/chrome/cdp"
import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const db = await getDb()
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const chromeTab = await openTab(url)
    const now = new Date().toISOString()
    const domain = (() => {
      try { return new URL(url).hostname } catch { return null }
    })()

    const newTab = {
      id: nanoid(),
      chromeId: chromeTab.id,
      url: chromeTab.url || url,
      title: chromeTab.title || url,
      domain,
      faviconUrl: chromeTab.faviconUrl || null,
      status: "open" as const,
      type: "page",
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    }

    db.insert(tabs).values(newTab).run()
    return NextResponse.json(newTab)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to open tab"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
