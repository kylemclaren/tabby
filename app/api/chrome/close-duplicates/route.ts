import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { closeTab } from "@/lib/chrome/cdp"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

/** GET: returns duplicate counts without closing anything */
export async function GET() {
  const db = await getDb()
  const openTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  const seen = new Map<string, typeof openTabs>()
  for (const tab of openTabs) {
    const existing = seen.get(tab.url)
    if (existing) existing.push(tab)
    else seen.set(tab.url, [tab])
  }

  const duplicates = Array.from(seen.entries())
    .filter(([, group]) => group.length > 1)
    .map(([url, group]) => ({ url, count: group.length }))

  const totalToClose = duplicates.reduce((sum, d) => sum + d.count - 1, 0)

  return NextResponse.json({ duplicates, totalToClose })
}

/** POST: close all duplicate tabs (keeps the first occurrence) */
export async function POST() {
  const db = await getDb()
  const openTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  const seen = new Map<string, boolean>()
  const toClose: typeof openTabs = []

  for (const tab of openTabs) {
    if (seen.has(tab.url)) {
      toClose.push(tab)
    } else {
      seen.set(tab.url, true)
    }
  }

  let closed = 0
  const now = new Date().toISOString()

  for (const tab of toClose) {
    try {
      if (tab.chromeId) await closeTab(tab.chromeId)
      db.update(tabs)
        .set({ status: "closed", closedAt: now, chromeId: null, updatedAt: now })
        .where(eq(tabs.id, tab.id))
        .run()
      closed++
    } catch {
      // skip tabs that fail to close
    }
  }

  return NextResponse.json({ closed })
}
