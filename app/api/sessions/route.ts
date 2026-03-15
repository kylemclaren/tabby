import { getDb } from "@/lib/db"
import { tabs, sessions, sessionTabs } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const db = await getDb()
  const result = db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.isAuto), desc(sessions.updatedAt))
    .all()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  const { name } = await request.json()

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const openTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  // Deduplicate tabs by URL within this session
  const seen = new Set<string>()
  const uniqueTabs = openTabs.filter((t) => {
    if (seen.has(t.url)) return false
    seen.add(t.url)
    return true
  })

  const now = new Date().toISOString()
  const session = {
    id: nanoid(),
    name: name.trim(),
    isAuto: false,
    tabCount: uniqueTabs.length,
    createdAt: now,
    updatedAt: now,
  }

  db.insert(sessions).values(session).run()

  if (uniqueTabs.length > 0) {
    db.insert(sessionTabs)
      .values(
        uniqueTabs.map((t, i) => ({
          id: nanoid(),
          sessionId: session.id,
          url: t.url,
          title: t.title,
          domain: t.domain,
          faviconUrl: t.faviconUrl,
          category: t.category,
          position: i,
        })),
      )
      .run()
  }

  return NextResponse.json(session, { status: 201 })
}
