import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { generate } from "@/lib/ollama"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

const MODEL = process.env.OLLAMA_MODEL || "qwen3.5:latest"

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(request: NextRequest) {
  const db = await getDb()
  const { tabId } = await request.json()

  const tab = db.select().from(tabs).where(eq(tabs.id, tabId)).get()
  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 })
  }

  try {
    let content = ""
    try {
      const res = await fetch(tab.url, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Tabby/1.0" },
      })
      if (res.ok) {
        const html = await res.text()
        content = stripHtml(html).slice(0, 4000)
      }
    } catch {
      content = `URL: ${tab.url}\nTitle: ${tab.title || "Unknown"}`
    }

    const summary = await generate(
      MODEL,
      `Summarize this web page in 2-3 concise sentences. Focus on the main topic and key information.\n\nPage title: ${tab.title || "Unknown"}\nURL: ${tab.url}\n\nContent:\n${content}`,
    )

    const now = new Date().toISOString()
    db.update(tabs)
      .set({ summary: summary.trim(), updatedAt: now })
      .where(eq(tabs.id, tabId))
      .run()

    return NextResponse.json({ id: tabId, summary: summary.trim() })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summarization failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
