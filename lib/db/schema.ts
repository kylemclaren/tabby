import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core"

export const tabs = sqliteTable("tabs", {
  id: text("id").primaryKey(),
  chromeId: text("chrome_id"),
  url: text("url").notNull(),
  title: text("title"),
  domain: text("domain"),
  faviconUrl: text("favicon_url"),
  status: text("status").notNull().default("open"),
  type: text("type").notNull().default("page"),
  category: text("category"),
  summary: text("summary"),
  ogImage: text("og_image"),
  description: text("description"),
  windowId: integer("window_id"),
  isArticle: integer("is_article", { mode: "boolean" }),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  firstSeenAt: text("first_seen_at").notNull(),
  lastSeenAt: text("last_seen_at").notNull(),
  closedAt: text("closed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  isSmart: integer("is_smart", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const tabsToGroups = sqliteTable(
  "tabs_to_groups",
  {
    tabId: text("tab_id")
      .notNull()
      .references(() => tabs.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.tabId, table.groupId] })],
)

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isAuto: integer("is_auto", { mode: "boolean" }).notNull().default(false),
  tabCount: integer("tab_count").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const sessionTabs = sqliteTable("session_tabs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  domain: text("domain"),
  faviconUrl: text("favicon_url"),
  category: text("category"),
  position: integer("position").notNull().default(0),
})

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
})
