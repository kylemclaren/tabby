import { getDb } from "@/lib/db"
import { sessions, sessionTabs } from "@/lib/db/schema"
import { openTab } from "@/lib/chrome/cdp"
import { eq, asc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const db = await getDb()
  const { sessionId } = await params

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })

  const tabs = db
    .select()
    .from(sessionTabs)
    .where(eq(sessionTabs.sessionId, sessionId))
    .orderBy(asc(sessionTabs.position))
    .all()

  // Batch 5 at a time to avoid overwhelming Chrome
  let restored = 0
  for (let i = 0; i < tabs.length; i += 5) {
    const batch = tabs.slice(i, i + 5)
    await Promise.all(
      batch.map(async (t) => {
        try {
          await openTab(t.url)
          restored++
        } catch {
          // Skip tabs that fail to open
        }
      }),
    )
  }

  return NextResponse.json({ restored, total: tabs.length })
}
