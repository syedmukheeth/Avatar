import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { env } from "@/lib/env"

import "./globals.css"

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: { default: "MindLink", template: "%s · MindLink" },
  description:
    "Talk to AI versions of creators, grounded in their own approved knowledge and voice.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
