import { getDb } from "@/lib/db"
import { groups } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const db = await getDb()
  const { groupId } = await params
  const body = await request.json()
  const now = new Date().toISOString()

  db.update(groups).set({ ...body, updatedAt: now }).where(eq(groups.id, groupId)).run()
  const updated = db.select().from(groups).where(eq(groups.id, groupId)).get()
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const db = await getDb()
  const { groupId } = await params
  db.delete(groups).where(eq(groups.id, groupId)).run()
  return NextResponse.json({ success: true })
}
