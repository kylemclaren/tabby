import { focusTab } from "@/lib/chrome/cdp"
import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const db = await getDb()
  const { tabId } = await request.json()

  const tab = db.select().from(tabs).where(eq(tabs.id, tabId)).get()
  if (!tab || !tab.chromeId) {
    return NextResponse.json({ error: "Tab not found or not open in Chrome" }, { status: 404 })
  }

  try {
    await focusTab(tab.chromeId)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to focus tab"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
