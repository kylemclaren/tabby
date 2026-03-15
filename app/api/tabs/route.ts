import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { eq, like, and, desc } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const db = await getDb()
  const { searchParams } = request.nextUrl
  const status = searchParams.get("status") || "open"
  const category = searchParams.get("category")
  const search = searchParams.get("search")

  const conditions = [eq(tabs.status, status)]
  if (category) conditions.push(eq(tabs.category, category))
  if (search) conditions.push(like(tabs.title, `%${search}%`))

  const result = db
    .select()
    .from(tabs)
    .where(and(...conditions))
    .orderBy(desc(tabs.lastSeenAt))
    .all()

  return NextResponse.json(result)
}
