"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { getRole, clearSession } from "@/lib/auth"
import {
  LayoutDashboard, Package, Wrench, ArrowRightLeft, Archive, Users, LogOut, Cog, FileText,
} from "lucide-react"

const NAV_GESTOR = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Peças de Reposição", href: "/pecas", icon: Cog },
  { label: "Funcionários", href: "/funcionarios", icon: Users },
  { label: "Termos", href: "/termos", icon: FileText },
]

const NAV_FUNCIONARIO = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Peças de Reposição", href: "/pecas", icon: Cog },
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
        <div className="p-4 border-b border-white/10 flex justify-center">
          <div className="bg-white rounded-md px-3 py-2">
            <Image src="/logo-seagro.jpg" alt="SEAGRO Soluções Ambientais" width={160} height={37} className="h-7 w-auto" priority />
          </div>
        </div>
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
        <button onClick={handleLogout} classNam