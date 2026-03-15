import { getDb } from "@/lib/db"
import { tabs, sessions, sessionTabs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function updateAutoSession(): Promise<void> {
  const db = await getDb()
  const now = new Date().toISOString()

  const openTabs = db.select().from(tabs).where(eq(tabs.status, "open")).all()

  // Find or create the auto-session
  let autoSession = db.select().from(sessions).where(eq(sessions.isAuto, true)).get()

  if (!autoSession) {
    autoSession = {
      id: nanoid(),
      name: "Latest",
      isAuto: true,
      tabCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    db.insert(sessions).values(autoSession).run()
  }

  // Full-replace session tabs
  db.delete(sessionTabs).where(eq(sessionTabs.sessionId, autoSession.id)).run()

  if (openTabs.length > 0) {
    db.insert(sessionTabs)
      .values(
        openTabs.map((t, i) => ({
          id: nanoid(),
          sessionId: autoSession.id,
          url: t.url,
          title: t.title,
          domain: t.domain,
          faviconUrl: t.faviconUrl,
          category: t.category,
          position: i,
        })),
      )
      .run()
  }

  db.update(sessions)
    .set({ tabCount: openTabs.length, updatedAt: now })
    .where(eq(sessions.id, autoSession.id))
    .run()
}
