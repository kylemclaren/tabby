import { NextResponse } from "next/server"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return NextResponse.json({ connected: false, models: [], selectedModel: null, url: OLLAMA_URL })
    const data = await res.json()
    const models = (data.models || []).map((m: { name: string }) => m.name)
    return NextResponse.json({
      connected: true,
      models,
      selectedModel: models[0] || null,
      url: OLLAMA_URL,
    })
  } catch {
    return NextResponse.json({ connected: false, models: [], selectedModel: null, url: OLLAMA_URL })
  }
}
