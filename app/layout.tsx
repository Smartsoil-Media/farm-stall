import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { InventoryProvider } from "@/lib/inventory-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Farm Stall Manager",
  description: "Manage your farm stall inventory and sales",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <InventoryProvider>
            {children}
            <Toaster />
          </InventoryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'