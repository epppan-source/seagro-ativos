"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { getRole, clearSession } from "@/lib/auth"
import {
  LayoutDashboard, Package, ArrowRightLeft, Archive, Users, LogOut, Cog, FileText, ArrowDownCircle, Menu, X,
} from "lucide-react"

const NAV_GESTOR = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Baixas", href: "/baixas", icon: ArrowDownCircle },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Peças de Reposição", href: "/pecas", icon: Cog },
  { label: "Funcionários", href: "/funcionarios", icon: Users },
  { label: "Termos", href: "/termos", icon: FileText },
]

const NAV_FUNCIONARIO = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ativos", href: "/ativos", icon: Package },
  { label: "Transf.", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Baixas", href: "/baixas", icon: ArrowDownCircle },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Peças", href: "/pecas", icon: Cog },
]

const NAV_FUNCIONARIO_FULL = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meus Ativos", href: "/ativos", icon: Package },
  { label: "Transferências", href: "/transferencias", icon: ArrowRightLeft },
  { label: "Baixas", href: "/baixas", icon: ArrowDownCircle },
  { label: "Materiais", href: "/materiais", icon: Archive },
  { label: "Peças de Reposição", href: "/pecas", icon: Cog },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [drawerAberto, setDrawerAberto] = useState(false)

  useEffect(() => {
    setRole(getRole())
  }, [])

  const navDesktop = role === "gestor" ? NAV_GESTOR : NAV_FUNCIONARIO_FULL

  function handleLogout() {
    clearSession()
    router.push("/login")
  }

  return (
    <div className="min-h-screen md:flex">

      {/* ── DESKTOP: sidebar lateral ── */}
      <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-60 bg-seagro-dark text-white flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex justify-center">
          <div className="bg-white rounded-md px-3 py-2">
            <Image src="/logo-seagro.jpg" alt="SEAGRO Soluções Ambientais" width={160} height={37} className="h-7 w-auto" priority />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navDesktop.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${active ? "bg-white/15" : "hover:bg-white/10"}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </a>
            )
          })}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-3 m-2 rounded text-sm hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* ── MOBILE: header fixo no topo ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-seagro-dark flex items-center justify-between px-4 shadow-md">
        <div className="bg-white rounded px-2 py-1">
          <Image src="/logo-seagro.jpg" alt="SEAGRO" width={110} height={26} className="h-6 w-auto" priority />
        </div>
        <button
          onClick={() => setDrawerAberto(true)}
          className="p-2 rounded text-white hover:bg-white/10 active:bg-white/20"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* ── MOBILE: drawer lateral (menu hambúrguer) ── */}
      {drawerAberto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerAberto(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-seagro-dark text-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <div className="bg-white rounded px-2 py-1">
                <Image src="/logo-seagro.jpg" alt="SEAGRO" width={110} height={26} className="h-6 w-auto" />
              </div>
              <button
                onClick={() => setDrawerAberto(false)}
                className="p-2 rounded hover:bg-white/10 active:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navDesktop.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerAberto(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                      active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </a>
                )
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                <LogOut className="h-5 w-5" /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main
        className="flex-1 bg-gray-50 p-4 md:p-6 pt-[4.5rem] md:pt-6 md:pb-6 min-h-[100dvh]"
        style={role === "funcionario" ? { paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" } : undefined}
      >
        {children}
      </main>

      {/* ── MOBILE: barra de navegação inferior (funcionário) ── */}
      {role === "funcionario" && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-seagro-dark border-t border-white/10 flex"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {NAV_FUNCIONARIO.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition ${
                  active ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </a>
            )
          })}
        </nav>
      )}

    </div>
  )
}
