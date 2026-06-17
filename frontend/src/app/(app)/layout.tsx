"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getRole, clearSession } from "@/lib/auth"
import {
  LayoutDashboard, Package, Wrench, ArrowRightLeft, Archive, Users, LogOut,
} from "lucide-react"

const NAV_GESTOR = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Funcionários", href: "/funcionarios", icon: Users },
]

const NAV_FUNCIONARIO = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    setRole(getRole())
  }, [])

  const nav = role === "gestor" ? NAV_GESTOR : NAV_FUNCIONARIO

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-seagro-dark text-white flex flex-col">
        <div className="p-4 text-lg font-bold border-b border-white/10">SEAGRO Ativos</div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${active ? "bg-white/15" : "hover:bg-white/10"}`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-3 m-2 rounded text-sm hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  )
}
