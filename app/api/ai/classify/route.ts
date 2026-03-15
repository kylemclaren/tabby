import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { chat } from "@/lib/ollama"
import { eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

const MODEL = process.env.OLLAMA_MODEL || "qwen3.5:latest"

export async function POST(request: NextRequest) {
  const db = await getDb()
  const { tabIds } = await request.json()

  if (!tabIds || !Array.isArray(tabIds) || tabIds.length === 0) {
    return NextResponse.json({ error: "tabIds array required" }, { status: 400 })
  }

  const tabsToClassify = db.select().from(tabs).where(inArray(tabs.id, tabIds)).all()

  if (tabsToClassify.length === 0) {
    return NextResponse.json({ error: "No tabs found" }, { status: 404 })
  }

  const tabList = tabsToClassify
    .map((t, i) => `${i + 1}. ${t.url} - "${t.title || "Untitled"}"`)
    .join("\n")

  try {
    const response = await chat(
      MODEL,
      [
        {
          role: "system",
          content: `You classify web pages into categories and detect if they are readable articles. Respond ONLY with valid JSON, no other text. Categories: work, social, shopping, research, entertainment, news, finance, development, education, other. An "article" is a page with long-form readable content like blog posts, news articles, tutorials, documentation pages, essays, etc. NOT articles: dashboards, app UIs, search results, social feeds, homepages, login pages, shopping listings.`,
        },
        {
          role: "user",
          content: `Classify each URL into exactly one category and whether it is a readable article. Return a JSON array like [{"index":1,"category":"development","isArticle":true},...]\n\nURLs:\n${tabList}`,
        },
      ],
      { format: "json" },
    )

    const parsed = JSON.parse(response)
    const results: Array<{ id: string; category: string; isArticle: boolean }> = []
    const now = new Date().toISOString()

    for (const item of parsed) {
      const idx = (item.index || item.i) - 1
      if (idx >= 0 && idx < tabsToClassify.length && item.category) {
        const tab = tabsToClassify[idx]
        const isArticle = item.isArticle === true
        db.update(tabs)
          .set({ category: item.category, isArticle, updatedAt: now })
          .where(eq(tabs.id, tab.id))
          .run()
        results.push({ id: tab.id, category: item.category, isArticle })
      }
    }

    return NextResponse.json({ classified: results.length, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Classification failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
