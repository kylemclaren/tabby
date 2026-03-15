import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { closeTab } from "@/lib/chrome/cdp"
import { eq, and, lt } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

/** GET: find tabs that haven't been seen/updated in a while */
export async function GET(request: NextRequest) {
  const db = await getDb()
  const hours = parseInt(request.nextUrl.searchParams.get("hours") || "24", 10)
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const staleTabs = db
    .select()
    .from(tabs)
    .where(and(eq(tabs.status, "open"), lt(tabs.lastSeenAt, cutoff)))
    .all()

  return NextResponse.json({ tabs: staleTabs, count: staleTabs.length, hours })
}

/** POST: close stale tabs */
export async function POST(request: NextRequest) {
  const db = await getDb()
  const { tabIds } = await request.json()

  if (!tabIds || !Array.isArray(tabIds) || tabIds.length === 0) {
    return NextResponse.json({ error: "tabIds array required" }, { status: 400 })
  }

  const now = new Date().toISOString()
  let closed = 0

  for (const tabId of tabIds) {
    const tab = db.select().from(tabs).where(eq(tabs.id, tabId)).get()
    if (!tab || tab.status !== "open") continue

    try {
      if (tab.chromeId) await closeTab(tab.chromeId)
      db.update(tabs)
        .set({ status: "closed", closedAt: now, chromeId: null, updatedAt: now })
        .where(eq(tabs.id, tab.id))
        .run()
      closed++
    } catch {
      // skip tabs that fail
    }
  }

  return NextResponse.json({ closed })
}
