"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NA_MAO_FUNCIONARIO: { label: "Com Funcionário", color: "bg-blue-100 text-blue-800" },
  NO_DEPOSITO: { label: "No Depósito", color: "bg-green-100 text-green-800" },
  EM_MANUTENCAO: { label: "Em Manutenção", color: "bg-orange-100 text-orange-800" },
  INATIVO: { label: "Inativo", color: "bg-gray-100 text-gray-600" },
}

interface Ativo {
  id: string
  codigo_interno: string
  categoria: string
  modelo: string
  marca: string
  status: string
}

export default function AtivosPage() {
  const [ativos, setAtivos] = useState<Ativo[]>([])

  useEffect(() => {
    api.get("/api/ativos").then((res) => setAtivos(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Ativos</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-3">Código</th><th className="p-3">Categoria</th>
              <th className="p-3">Modelo</th><th className="p-3">Marca</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ativos.map((a) => {
              const cfg = STATUS_CONFIG[a.status] || { label: a.status, color: "bg-gray-100 text-gray-600" }
              return (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{a.codigo_interno}</td>
                  <td className="p-3">{a.categoria}</td>
                  <td className="p-3">{a.modelo}</td>
                  <td className="p-3">{a.marca}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${cfg.color}`}>{cfg.label}</span></td>
                </tr>
              )
            })}
            {ativos.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum ativo cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
