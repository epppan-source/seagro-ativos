"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

export default function TrocarSenhaPage() {
  const router = useRouter()
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem")
      return
    }
    setLoading(true)
    try {
      await api.post("/api/auth/trocar-senha", { senha_atual: senhaAtual, nova_senha: novaSenha, confirmar_senha: confirmarSenha })
      router.push("/dashboard")
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Não foi possível alterar a senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seagro-dark to-seagro flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-lg font-bold text-seagro-dark mb-1">Troque sua senha</h1>
        <p className="text-sm text-gray-500 mb-4">Por segurança, defina uma nova senha antes de continuar.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm rounded p-2">{erro}</div>}
          <div>
            <label className="text-sm font-medium text-gray-700">Senha atual</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nova senha</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Confirmar nova senha</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-seagro-dark hover:bg-seagro-dark/90 text-white rounded py-2 font-medium disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar e continuar"}
          </button>
        </form>
      </div>
    </div>
  )
}
