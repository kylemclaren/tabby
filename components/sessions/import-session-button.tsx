"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload04Icon } from "@hugeicons/core-free-icons"

interface ImportSessionButtonProps {
  onImport: () => void
}

export function ImportSessionButton({ onImport }: ImportSessionButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const res = await fetch("/api/sessions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Import failed")
        return
      }

      onImport()
    } catch {
      alert("Invalid JSON file")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleFile} />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <HugeiconsIcon icon={Upload04Icon} className="size-4" />
        Import
      </Button>
    </>
  )
}
