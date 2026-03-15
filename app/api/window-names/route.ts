import { getDb } from "@/lib/db"
import { settings } from "@/lib/db/schema"
import { eq, like } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

const PREFIX = "window_name:"

export async function GET() {
  const db = await getDb()
  const rows = db.select().from(settings).where(like(settings.key, `${PREFIX}%`)).all()

  const names: Record<string, string> = {}
  for (const row of rows) {
    const windowId = row.key.slice(PREFIX.length)
    if (row.value) names[windowId] = row.value
  }

  return NextResponse.json(names)
}

export async function PUT(request: NextRequest) {
  const db = await getDb()
  const { windowId, name } = await request.json()

  if (windowId == null || typeof name !== "string") {
    return NextResponse.json({ error: "windowId and name required" }, { status: 400 })
  }

  const key = `${PREFIX}${windowId}`
  const trimmed = name.trim()

  if (!trimmed) {
    db.delete(settings).where(eq(settings.key, key)).run()
  } else {
    db.insert(settings)
      .values({ key, value: trimmed })
      .onConflictDoUpdate({ target: settings.key, set: { value: trimmed } })
      .run()
  }

  return NextResponse.json({ windowId, name: trimmed || null })
}
