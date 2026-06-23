"use client"
import { useState } from "react"
import api from "@/lib/api"

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/api/auth/esqueci-senha", { email })
    } finally {
      setEnviado(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-seagro-dark to-seagro flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-8">
        <h1 className="text-lg font-bold text-seagro-dark mb-4">Redefinir senha</h1>
        {enviado ? (
          <p className="text-sm text-gray-600">Se o e-mail existir em nossa base, enviaremos um link de redefinição.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">E-mail</label>
              <input type="email" className="mt-1 w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-seagro-dark hover:bg-seagro-dark/90 text-white rounded py-2 font-medium disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}
        <p className="text-center text-sm mt-4"><a href="/login" className="text-seagro hover:underline">Voltar ao login</a></p>
      </div>
    </div>
  )
}
