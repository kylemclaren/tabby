const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"

interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

interface ChatResponse {
  message: { role: string; content: string }
  done: boolean
}

interface GenerateResponse {
  response: string
  done: boolean
}

export async function chat(
  model: string,
  messages: ChatMessage[],
  options?: { format?: "json"; signal?: AbortSignal; think?: boolean },
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      think: options?.think ?? false,
      ...(options?.format && { format: options.format }),
    }),
    signal: options?.signal ?? AbortSignal.timeout(120_000),
  })

  if (!res.ok) throw new Error(`Ollama chat failed (${res.status})`)
  const data: ChatResponse = await res.json()
  return data.message.content
}

export async function generate(
  model: string,
  prompt: string,
  options?: { signal?: AbortSignal; think?: boolean },
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, think: options?.think ?? false }),
    signal: options?.signal ?? AbortSignal.timeout(120_000),
  })

  if (!res.ok) throw new Error(`Ollama generate failed (${res.status})`)
  const data: GenerateResponse = await res.json()
  return data.response
}

export async function listModels(): Promise<string[]> {
  const res = await fetch(`${OLLAMA_URL}/api/tags`, { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return (data.models || []).map((m: { name: string }) => m.name)
}

export async function isAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}
