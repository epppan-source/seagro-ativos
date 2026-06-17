"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"

interface Transferencia {
  id: string
  ativo_id: string
  status: string
  motivo_solicitacao: string | null
  solicitado_em: string
}

export default function TransferenciasPage() {
  const [lista, setLista] = useState<Transferencia[]>([])
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    setRole(getRole())
    api.get("/api/transferencias").then((res) => setLista(res.data)).catch(() => {})
  }, [])

  async function decidir(id: string, aprovar: boolean) {
    await api.post(`/api/transferencias/${id}/decisao`, { aprovar })
    const res = await api.get("/api/transferencias")
    setLista(res.data)
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Transferências</h1>
      <div className="space-y-3">
        {lista.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Ativo: {t.ativo_id}</p>
              <p className="text-sm text-gray-500">{t.motivo_solicitacao || "Sem motivo informado"}</p>
              <span className="text-xs text-gray-400">{new Date(t.solicitado_em).toLocaleString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{t.status}</span>
              {role === "gestor" && t.status === "PENDENTE" && (
                <>
                  <button onClick={() => decidir(t.id, true)} className="text-xs bg-green-600 text-white px-3 py-1 rounded">Aprovar</button>
                  <button onClick={() => decidir(t.id, false)} className="text-xs bg-red-600 text-white px-3 py-1 rounded">Rejeitar</button>
                </>
              )}
            </div>
          </div>
        ))}
        {lista.length === 0 && <p className="text-gray-400">Nenhuma transferência registrada.</p>}
      </div>
    </div>
  )
}
