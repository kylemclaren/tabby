import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { chat, generate, isAvailable } from "@/lib/ollama"
import { eq, and, isNull } from "drizzle-orm"

const MODEL = process.env.OLLAMA_MODEL || "qwen3.5:latest"
const CLASSIFY_BATCH_SIZE = 20
const SUMMARIZE_BATCH_SIZE = 5

let isProcessing = false

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function classifyTabs(
  db: Awaited<ReturnType<typeof getDb>>,
  uncategorized: Array<{ id: string; url: string; title: string | null }>,
) {
  // Process in batches
  for (let i = 0; i < uncategorized.length; i += CLASSIFY_BATCH_SIZE) {
    const batch = uncategorized.slice(i, i + CLASSIFY_BATCH_SIZE)
    const tabList = batch
      .map((t, idx) => `${idx + 1}. ${t.url} - "${t.title || "Untitled"}"`)
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
      const now = new Date().toISOString()

      for (const item of parsed) {
        const idx = (item.index || item.i) - 1
        if (idx >= 0 && idx < batch.length && item.category) {
          db.update(tabs)
            .set({
              category: item.category,
              isArticle: item.isArticle === true,
              updatedAt: now,
            })
            .where(eq(tabs.id, batch[idx].id))
            .run()
        }
      }
    } catch (e) {
      console.error("[auto-ai] classify batch failed:", e)
    }
  }
}

async function summarizeTabs(
  db: Awaited<ReturnType<typeof getDb>>,
  unsummarized: Array<{ id: string; url: string; title: string | null }>,
) {
  // Process a limited batch per sync cycle to avoid hammering Ollama
  const batch = unsummarized.slice(0, SUMMARIZE_BATCH_SIZE)

  for (const tab of batch) {
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
        .where(eq(tabs.id, tab.id))
        .run()
    } catch (e) {
      console.error("[auto-ai] summarize failed for tab:", tab.id, e)
    }
  }
}

/**
 * Automatically classify and summarize open tabs that haven't been processed yet.
 * Runs in the background after each sync - non-blocking and idempotent.
 */
export async function autoProcessTabs(): Promise<void> {
  // Prevent concurrent runs
  if (isProcessing) return
  isProcessing = true

  try {
    // Check if Ollama is reachable before doing anything
    const available = await isAvailable()
    if (!available) return

    const db = await getDb()

    // Find open tabs without a category
    const uncategorized = db
      .select({ id: tabs.id, url: tabs.url, title: tabs.title })
      .from(tabs)
      .where(and(eq(tabs.status, "open"), isNull(tabs.category)))
      .all()

    // Find open tabs without a summary
    const unsummarized = db
      .select({ id: tabs.id, url: tabs.url, title: tabs.title })
      .from(tabs)
      .where(and(eq(tabs.status, "open"), isNull(tabs.summary)))
      .all()

    // Classify first (fast, batched), then summarize (slower, one-by-one)
    if (uncategorized.length > 0) {
      await classifyTabs(db, uncategorized)
    }

    if (unsummarized.length > 0) {
      await summarizeTabs(db, unsummarized)
    }
  } catch (e) {
    console.error("[auto-ai] auto-process failed:", e)
  } finally {
    isProcessing = false
  }
}
