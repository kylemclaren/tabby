import { getDb } from "@/lib/db"
import { tabs, tabsToGroups } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const db = await getDb()
  const { groupId } = await params

  const result = db
    .select({
      id: tabs.id,
      chromeId: tabs.chromeId,
      url: tabs.url,
      title: tabs.title,
      domain: tabs.domain,
      faviconUrl: tabs.faviconUrl,
      status: tabs.status,
      type: tabs.type,
      category: tabs.category,
      summary: tabs.summary,
      ogImage: tabs.ogImage,
      description: tabs.description,
      windowId: tabs.windowId,
      isPinned: tabs.isPinned,
      firstSeenAt: tabs.firstSeenAt,
      lastSeenAt: tabs.lastSeenAt,
      closedAt: tabs.closedAt,
      createdAt: tabs.createdAt,
      updatedAt: tabs.updatedAt,
    })
    .from(tabsToGroups)
    .innerJoin(tabs, eq(tabsToGroups.tabId, tabs.id))
    .where(eq(tabsToGroups.groupId, groupId))
    .all()

  return NextResponse.json(result)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const db = await getDb()
  const { groupId } = await params
  const { tabIds, action } = await request.json()

  if (!tabIds || !Array.isArray(tabIds)) {
    return NextResponse.json({ error: "tabIds array required" }, { status: 400 })
  }

  if (action === "remove") {
    for (const tabId of tabIds) {
      db.delete(tabsToGroups)
        .where(and(eq(tabsToGroups.tabId, tabId), eq(tabsToGroups.groupId, groupId)))
        .run()
    }
  } else {
    for (const tabId of tabIds) {
      db.insert(tabsToGroups).values({ tabId, groupId }).onConflictDoNothing().run()
    }
  }

  return NextResponse.json({ success: true })
}
