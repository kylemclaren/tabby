import { getChromeStatus } from "@/lib/chrome/cdp"
import { NextResponse } from "next/server"

export async function GET() {
  const status = await getChromeStatus()
  return NextResponse.json({
    ...status,
    debugUrl: process.env.CHROME_DEBUG_URL || "http://localhost:9222",
  })
}
