import type { Metadata } from "next"
import { Fraunces, Instrument_Sans } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { siteUrl } from "@/lib/site-url"

import "./globals.css"

const display = Fraunces({ variable: "--font-display-serif", subsets: ["latin"] })
const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "MindLink · AI characters of real creators", template: "%s · MindLink" },
  description:
    "Chat with and call AI versions of creators, grounded in their own approved knowledge and voice.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
