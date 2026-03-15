import { getDb } from "@/lib/db"
import { groups, tabsToGroups } from "@/lib/db/schema"
import { nanoid } from "nanoid"
import { sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const db = await getDb()
  const result = db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      color: groups.color,
      icon: groups.icon,
      isSmart: groups.isSmart,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
      tabCount: sql<number>`(SELECT COUNT(*) FROM tabs_to_groups WHERE group_id = ${groups.id})`,
    })
    .from(groups)
    .all()

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  const body = await request.json()
  const now = new Date().toISOString()

  const newGroup = {
    id: nanoid(),
    name: body.name,
    description: body.description || null,
    color: body.color || null,
    icon: body.icon || null,
    isSmart: body.isSmart || false,
    createdAt: now,
    updatedAt: now,
  }

  db.insert(groups).values(newGroup).run()

  if (body.tabIds && Array.isArray(body.tabIds)) {
    for (const tabId of body.tabIds) {
      db.insert(tabsToGroups).values({ tabId, groupId: newGroup.id }).onConflictDoNothing().run()
    }
  }

  return NextResponse.json(newGroup, { status: 201 })
}
