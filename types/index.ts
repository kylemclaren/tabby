export interface ChromeTab {
  id: string
  type: string
  title: string
  url: string
  faviconUrl?: string
  windowId?: number | null
  webSocketDebuggerUrl?: string
}

export interface Tab {
  id: string
  chromeId: string | null
  url: string
  title: string | null
  domain: string | null
  faviconUrl: string | null
  status: "open" | "closed"
  type: string
  category: string | null
  summary: string | null
  ogImage: string | null
  description: string | null
  windowId: number | null
  isArticle: boolean | null
  isPinned: boolean
  firstSeenAt: string
  lastSeenAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  isSmart: boolean
  createdAt: string
  updatedAt: string
  tabCount?: number
}

export interface SyncResult {
  added: number
  updated: number
  closed: number
  total: number
}

export interface ChromeStatus {
  connected: boolean
  browser?: string
  version?: string
  debugUrl: string
  error?: string
}

export interface OllamaStatus {
  connected: boolean
  models: string[]
  selectedModel: string | null
  url: string
}

export interface Session {
  id: string
  name: string
  isAuto: boolean
  tabCount: number
  createdAt: string
  updatedAt: string
}

export interface SessionTab {
  id: string
  sessionId: string
  url: string
  title: string | null
  domain: string | null
  faviconUrl: string | null
  category: string | null
  position: number
}

export interface SessionWithTabs extends Session {
  tabs: SessionTab[]
}

export interface SessionExport {
  version: 1
  exportedAt: string
  session: {
    name: string
    createdAt: string
    tabs: Array<{
      url: string
      title: string | null
      domain: string | null
      faviconUrl: string | null
      category: string | null
      position: number
    }>
  }
}

export type TabCategory =
  | "work"
  | "social"
  | "shopping"
  | "research"
  | "entertainment"
  | "news"
  | "finance"
  | "development"
  | "education"
  | "other"

export const TAB_CATEGORIES: TabCategory[] = [
  "work",
  "social",
  "shopping",
  "research",
  "entertainment",
  "news",
  "finance",
  "development",
  "education",
  "other",
]

export const CATEGORY_COLORS: Record<TabCategory, string> = {
  work: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  social: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  shopping: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  research: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  entertainment: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  news: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
  finance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  development: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  education: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  other: "bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200",
}
