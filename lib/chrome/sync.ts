import { getDb } from "@/lib/db"
import { tabs } from "@/lib/db/schema"
import { listTabs } from "./cdp"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { updateAutoSession } from "@/lib/sessions/auto-save"
import { shouldPreferOgImage, fetchOgImage, isTweetUrl, fetchTweetData } from "@/lib/og"
import type { SyncResult } from "@/types"

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export async function syncTabs(): Promise<SyncResult> {
  const now = new Date().toISOString()
  const db = await getDb()

  const chromeTabs = await listTabs()
  const dbTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  const chromeIdSet = new Set(chromeTabs.map((t) => t.id))
  const dbChromeIdMap = new Map(dbTabs.map((t) => [t.chromeId, t]))

  let added = 0
  let updated = 0
  let closed = 0
  const ogFetchQueue: { id: string; url: string }[] = []
  const tweetFetchQueue: { id: string; url: string }[] = []

  for (const chromeTab of chromeTabs) {
    const existing = dbChromeIdMap.get(chromeTab.id)
    const domain = extractDomain(chromeTab.url)

    if (existing) {
      db.update(tabs)
        .set({
          url: chromeTab.url,
          title: chromeTab.title,
          domain,
          faviconUrl: chromeTab.faviconUrl || existing.faviconUrl,
          windowId: chromeTab.windowId ?? null,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(tabs.id, existing.id))
        .run()

      // Queue enrichment
      if (isTweetUrl(domain) && !existing.description) {
        tweetFetchQueue.push({ id: existing.id, url: chromeTab.url })
      } else if (existing.url !== chromeTab.url && !existing.ogImage && shouldPreferOgImage(domain)) {
        ogFetchQueue.push({ id: existing.id, url: chromeTab.url })
      }
      updated++
    } else {
      const id = nanoid()
      db.insert(tabs)
        .values({
          id,
          chromeId: chromeTab.id,
          url: chromeTab.url,
          title: chromeTab.title,
          domain,
          faviconUrl: chromeTab.faviconUrl || null,
          windowId: chromeTab.windowId ?? null,
          status: "open",
          type: chromeTab.type,
          firstSeenAt: now,
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .run()

      if (isTweetUrl(domain)) {
        tweetFetchQueue.push({ id, url: chromeTab.url })
      } else if (shouldPreferOgImage(domain)) {
        ogFetchQueue.push({ id, url: chromeTab.url })
      }
      added++
    }
  }

  for (const dbTab of dbTabs) {
    if (dbTab.chromeId && !chromeIdSet.has(dbTab.chromeId)) {
      db.update(tabs)
        .set({ status: "closed", closedAt: now, chromeId: null, updatedAt: now })
        .where(eq(tabs.id, dbTab.id))
        .run()
      closed++
    }
  }

  await updateAutoSession()

  // Fetch OG images and tweet data in the background (non-blocking)
  const enrichPromises: Promise<unknown>[] = []

  if (ogFetchQueue.length > 0) {
    enrichPromises.push(
      Promise.allSettled(
        ogFetchQueue.map(async ({ id, url }) => {
          const ogImage = await fetchOgImage(url)
          if (ogImage) {
            db.update(tabs)
              .set({ ogImage, updatedAt: new Date().toISOString() })
              .where(eq(tabs.id, id))
              .run()
          }
        }),
      ),
    )
  }

  if (tweetFetchQueue.length > 0) {
    enrichPromises.push(
      Promise.allSettled(
        tweetFetchQueue.map(async ({ id, url }) => {
          const tweet = await fetchTweetData(url)
          if (tweet) {
            db.update(tabs)
              .set({
                description: JSON.stringify(tweet),
                ogImage: tweet.imageUrl,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(tabs.id, id))
              .run()
          }
        }),
      ),
    )
  }

  Promise.all(enrichPromises).catch(() => {})

  return { added, updated, closed, total: chromeTabs.length }
}
