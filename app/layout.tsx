import { Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SyncProvider } from "@/components/providers/sync-provider"
import { AppShell } from "@/components/layout/app-shell"
import { CommandPalette } from "@/components/command-palette"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Tabby — Chrome Tab Manager",
  description: "Manage your Chrome tabs with AI-powered organization",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <ThemeProvider>
          <SyncProvider>
            <AppShell>{children}</AppShell>
            <CommandPalette />
            <Toaster />
          </SyncProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
