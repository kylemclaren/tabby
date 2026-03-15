"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Globe02Icon } from "@hugeicons/core-free-icons"

interface FaviconImageProps {
  url: string | null
  domain: string | null
  size?: number
  className?: string
}

export function FaviconImage({ url, domain, size = 32, className }: FaviconImageProps) {
  const [error, setError] = useState(false)

  const faviconSrc =
    url && !error ? url : domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null

  if (!faviconSrc || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-muted ${className}`}
        style={{ width: size, height: size }}
      >
        <HugeiconsIcon icon={Globe02Icon} className="text-muted-foreground" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    )
  }

  return (
    <img
      src={faviconSrc}
      alt=""
      width={size}
      height={size}
      className={`rounded-md ${className}`}
      onError={() => setError(true)}
    />
  )
}
