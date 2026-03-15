import { getDb } from "@/lib/db"
import { sessions, sessionTabs } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
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

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    session: {
      name: session.name,
      createdAt: session.createdAt,
      tabs: tabs.map((t) => ({
        url: t.url,
        title: t.title,
        domain: t.domain,
        faviconUrl: t.faviconUrl,
        category: t.category,
        position: t.position,
      })),
    },
  }

  const slug = session.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const date = new Date().toISOString().split("T")[0]

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tabby-session-${slug}-${date}.json"`,
    },
  })
}
