import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { chat } from "@/lib/ollama"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

const MODEL = process.env.OLLAMA_MODEL || "qwen3.5:latest"

export async function POST() {
  const db = await getDb()
  const openTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  if (openTabs.length < 2) {
    return NextResponse.json({ error: "Need at least 2 open tabs" }, { status: 400 })
  }

  const tabList = openTabs
    .map((t, i) => `${i + 1}. ${t.url} - "${t.title || "Untitled"}" [${t.category || "uncategorized"}]`)
    .join("\n")

  try {
    const response = await chat(
      MODEL,
      [
        { role: "system", content: `You suggest logical tab groups. Respond ONLY with valid JSON, no other text.` },
        {
          role: "user",
          content: `Given these browser tabs, suggest logical groups. Return JSON like:
{"groups":[{"name":"Group Name","description":"Why these tabs belong together","tabIndices":[1,3,5]},...]}

Tabs:\n${tabList}`,
        },
      ],
      { format: "json" },
    )

    const parsed = JSON.parse(response)
    const suggestions = (parsed.groups || []).map(
      (g: { name: string; description: string; tabIndices: number[] }) => ({
        name: g.name,
        description: g.description,
        tabs: (g.tabIndices || [])
          .filter((i: number) => i >= 1 && i <= openTabs.length)
          .map((i: number) => ({ id: openTabs[i - 1].id, title: openTabs[i - 1].title, url: openTabs[i - 1].url })),
      }),
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestion failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
