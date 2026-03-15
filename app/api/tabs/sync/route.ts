import { syncTabs } from "@/lib/chrome/sync"
import { autoProcessTabs } from "@/lib/ai/auto-process"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const result = await syncTabs()

    // Fire-and-forget: auto-classify and summarize new tabs in the background
    autoProcessTabs().catch((e) =>
      console.error("[sync] auto-process error:", e),
    )

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
