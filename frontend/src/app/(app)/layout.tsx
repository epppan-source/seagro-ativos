"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { getRole, clearSession } from "@/lib/auth"
import {
  LayoutDashboard, Package, Wrench, ArrowRightLeft, Archive,
  Users, LogOut, Cog, FileText, Menu, X,
} from "lucide-react"

const NAV_GESTOR = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ativos", href: "/ativos", icon: Package },
  { label: "Transferencias", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Pecas de Reposicao", href: "/pecas", icon: Cog },
  { label: "Funcionarios", href: "/funcionarios", icon: Users },
  { label: "Termos", href: "/termos", icon: FileText },
]

const NAV_FUNCIONARIO = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Ativos", href: "/ativos", icon: Package },
  { label: "Transferencias", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Pecas de Reposicao", href: "/pecas", icon: Cog },
]

// Labels com acentos separados para evitar truncamento de encoding
const LABEL_MAP: Record<string, string> = {
  "Transferencias": "Transferências",
  "Pecas de Reposicao": "Peças de Reposição",
  "Funcionarios": "Funcionários",
}

function label(raw: string) {
  return LABEL_MAP[raw] ?? raw
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setRole(getRole())
  }, [])

  // Fecha gaveta ao navegar
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const nav = role === "gestor" ? NAV_GESTOR : NAV_FUNCIONARIO

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  const NavLinks = () => (
    <>
      <nav className="flex-1 p-2 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded text-sm min-h-[44px] ${
                active ? "bg-white/15" : "hover:bg-white/10"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {label(item.label)}
            </a>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-3 m-2 rounded text-sm hover:bg-white/10 min-h-[44px]"
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </>
  )

  return (
    <div className="min-h-screen flex">

      {/* ---- SIDEBAR DESKTOP (md+) ---- */}
      <aside className="hidden md:flex w-60 bg-seagro-dark text-white flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex justify-center">
          <div className="bg-white rounded-md px-3 py-2">
            <Image
              src="/logo-seagro.jpg"
              alt="SEAGRO"
              width={160}
              height={37}
              className="h-7 w-auto"
              priority
            />
          </div>
        </div>
        <NavLinks />
      </aside>

      {/* ---- GAVETA MOBILE (< md) ---- */}
      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      {/* Gaveta */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] z-50 bg-seagro-dark text-white flex flex-col transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="bg-white rounded-md px-3 py-2">
            <Image
              src="/logo-seagro.jpg"
              alt="SEAGRO"
              width={140}
              height={32}
              className="h-7 w-auto"
              priority
            />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-white p-2 hover:bg-white/10 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks />
      </aside>

      {/* ---- AREA PRINCIPAL ---- */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header fixo mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-seagro-dark text-white flex items-center justify-between px-4 h-14 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-white/10 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="bg-white rounded-md px-2 py-1">
            <Image
              src="/logo-seagro.jpg"
              alt="SEAGRO"
              width={120}
              height={28}
              className="h-6 w-auto"
              priority
            />
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 bg-gray-50 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
