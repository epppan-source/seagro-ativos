import "./globals.css"
import type { Metadata } from "next"
import { Montserrat, Open_Sans } from "next/font/google"

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
})

export const metadata: Metadata = {
  title: "SEAGRO Ativos",
  description: "Sistema de Gestão de Ativos - SEAGRO",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${montserrat.variable} ${openSans.variable} font-sans`}>{children}</body>
    </html>
  )
}
