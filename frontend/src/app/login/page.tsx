"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import api from "@/lib/api"
import { setSessionCookie } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)
    try {
      const { data } = await api.post("/api/auth/login", { login, senha })
      setSessionCookie(data.access_token, data.role)
      if (data.deve_trocar_senha) {
        router.push("/trocar-senha")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setErro("Login ou senha incorretos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seagro-dark to-seagro flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <Image src="/logo-seagro.jpg" alt="SEAGRO Soluções Ambientais" width={220} height={51} className="mx-auto h-10 w-auto" priority />
          <p className="text-sm text-gray-500 mt-2">Sistema de Gestão de Ativos</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm rounded p-2">{erro}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700">Login</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={login} onChange={(e) => setLogin(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-seagro-dark hover:bg-seagro-dark/90 text-white rounded py-2 font-medium disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-sm">
            <a href="/esqueci-senha" className="text-seagro hover:underline">Esqueci minha senha</a>
          </p>
        </form>
      </div>
    </div>
  )
}
