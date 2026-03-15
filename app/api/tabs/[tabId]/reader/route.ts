import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

function extractArticleContent(html: string): {
  title: string | null
  content: string
  siteName: string | null
} {
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : null

  // Extract og:site_name
  const siteMatch = html.match(
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
  )
  const siteName = siteMatch ? siteMatch[1] : null

  // Try to find the article body — look for <article>, <main>, or common content containers
  let body = ""

  // Strategy 1: <article> tag
  const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    body = articleMatch[1]
  }

  // Strategy 2: role="main" or <main>
  if (!body) {
    const mainMatch = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i)
    if (mainMatch) body = mainMatch[1]
  }

  // Strategy 3: common content class names
  if (!body) {
    const contentPatterns = [
      /class=["'][^"']*(?:article-body|post-content|entry-content|story-body|article-content|post-body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)/i,
    ]
    for (const pattern of contentPatterns) {
      const match = html.match(pattern)
      if (match) {
        body = match[1]
        break
      }
    }
  }

  // Strategy 4: fall back to <body>
  if (!body) {
    const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i)
    if (bodyMatch) body = bodyMatch[1]
  }

  // Clean up HTML to readable text with basic structure preserved
  const content = body
    // Remove script/style/nav/header/footer
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    // Convert structural elements to line breaks
    .replace(/<\/(?:p|div|h[1-6]|li|br|tr|blockquote)>/gi, "\n\n")
    .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<h([1-6])[^>]*>/gi, "\n## ")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return { title, content, siteName }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tabId: string }> },
) {
  const { tabId } = await params
  const db = await getDb()

  const tab = db.select().from(tabs).where(eq(tabs.id, tabId)).get()
  if (!tab) {
    return NextResponse.json({ error: "Tab not found" }, { status: 404 })
  }

  try {
    const res = await fetch(tab.url, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Tabby/1.0; +https://tabby.dev)",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page (${res.status})` },
        { status: 502 },
      )
    }

    const html = await res.text()
    const article = extractArticleContent(html)

    return NextResponse.json({
      title: article.title || tab.title,
      siteName: article.siteName,
      content: article.content.slice(0, 50_000), // cap at 50k chars
      url: tab.url,
      summary: tab.summary,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch article"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
