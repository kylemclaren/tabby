import { getDb } from "@/lib/db"
import { sessions, sessionTabs } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import { NextRequest, NextResponse } from "next/server"

const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:"]
const MAX_TABS = 1000

export async function POST(request: NextRequest) {
  const db = await getDb()
  const body = await request.json()

  // Validate structure
  if (body.version !== 1) {
    return NextResponse.json({ error: "Unsupported export version" }, { status: 400 })
  }
  if (!body.session?.name || typeof body.session.name !== "string") {
    return NextResponse.json({ error: "Session name is required" }, { status: 400 })
  }
  if (!Array.isArray(body.session?.tabs) || body.session.tabs.length === 0) {
    return NextResponse.json({ error: "Session must have at least one tab" }, { status: 400 })
  }
  if (body.session.tabs.length > MAX_TABS) {
    return NextResponse.json({ error: `Maximum ${MAX_TABS} tabs per session` }, { status: 400 })
  }

  // Validate URLs
  for (const tab of body.session.tabs) {
    if (!tab.url || typeof tab.url !== "string") {
      return NextResponse.json({ error: "Each tab must have a URL" }, { status: 400 })
    }
    if (BLOCKED_PROTOCOLS.some((p) => tab.url.toLowerCase().startsWith(p))) {
      return NextResponse.json({ error: `Blocked URL protocol: ${tab.url}` }, { status: 400 })
    }
  }

  const now = new Date().toISOString()
  const session = {
    id: nanoid(),
    name: body.session.name.trim(),
    isAuto: false,
    tabCount: body.session.tabs.length,
    createdAt: body.session.createdAt || now,
    updatedAt: now,
  }

  db.insert(sessions).values(session).run()

  db.insert(sessionTabs)
    .values(
      body.session.tabs.map((t: any, i: number) => ({
        id: nanoid(),
        sessionId: session.id,
        url: t.url,
        title: t.title || null,
        domain: t.domain || null,
        faviconUrl: t.faviconUrl || null,
        category: t.category || null,
        position: t.position ?? i,
      })),
    )
    .run()

  return NextResponse.json(session, { status: 201 })
}
