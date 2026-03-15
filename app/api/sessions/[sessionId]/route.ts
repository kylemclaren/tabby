import { getDb } from "@/lib/db"
import { sessions, sessionTabs } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ sessionId: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
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

  return NextResponse.json({ ...session, tabs })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const db = await getDb()
  const { sessionId } = await params
  const { name } = await request.json()

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  if (session.isAuto) return NextResponse.json({ error: "Cannot rename auto-session" }, { status: 400 })

  const now = new Date().toISOString()
  db.update(sessions)
    .set({ name: name.trim(), updatedAt: now })
    .where(eq(sessions.id, sessionId))
    .run()

  const updated = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const db = await getDb()
  const { sessionId } = await params

  const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get()
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 })
  if (session.isAuto) return NextResponse.json({ error: "Cannot delete auto-session" }, { status: 400 })

  db.delete(sessions).where(eq(sessions.id, sessionId)).run()
  return NextResponse.json({ success: true })
}
