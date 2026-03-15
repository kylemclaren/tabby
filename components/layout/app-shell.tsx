"use client"

import { Sidebar } from "./sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
