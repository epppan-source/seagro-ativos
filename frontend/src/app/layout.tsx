import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SEAGRO Ativos",
  description: "Sistema de Gestão de Ativos - SEAGRO",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
