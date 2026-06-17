"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"

interface Material {
  id: string
  nome: string
  codigo: string
  quantidade_atual: number
  quantidade_minima: number
  unidade: string
}

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([])

  useEffect(() => {
    api.get("/api/materiais").then((res) => setMateriais(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Materiais</h1>
      <div className="space-y-3">
        {materiais.map((m) => {
          const pct = Math.min((m.quantidade_atual / (m.quantidade_minima * 2 || 1)) * 100, 100)
          const color = m.quantidade_atual === 0 ? "bg-red-500" : m.quantidade_atual <= m.quantidade_minima ? "bg-orange-400" : "bg-green-500"
          return (
            <div key={m.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{m.nome} <span className="text-gray-400 text-xs">({m.codigo})</span></span>
                <span className="text-xs text-gray-500">{m.quantidade_atual} / {m.quantidade_minima} {m.unidade}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        {materiais.length === 0 && <p className="text-gray-400">Nenhum material cadastrado ainda.</p>}
      </div>
    </div>
  )
}
