"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Package, Wrench, ArrowRightLeft, Archive } from "lucide-react"

interface Resumo {
  total_ativos: number
  ativos_por_status: Record<string, number>
  transferencias_pendentes: number
  manutencoes_agendadas: number
  materiais_baixo_estoque: number
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null)

  useEffect(() => {
    api.get("/api/dashboard/resumo").then((res) => setResumo(res.data)).catch(() => {})
  }, [])

  if (!resumo) return <p className="text-gray-500">Carregando...</p>

  const cards = [
    { label: "Total de Ativos", value: resumo.total_ativos, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Transferências Pendentes", value: resumo.transferencias_pendentes, icon: ArrowRightLeft, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Manutenções Agendadas", value: resumo.manutencoes_agendadas, icon: Wrench, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Materiais em Baixo Estoque", value: resumo.materiais_baixo_estoque, icon: Archive, color: "text-red-600", bg: "bg-red-50" },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{c.label}</span>
              <div className={`${c.bg} p-2 rounded-full`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Ativos por status</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(resumo.ativos_por_status).map(([status, qtd]) => (
            <li key={status} className="flex justify-between border-b py-1">
              <span>{status}</span><span className="font-medium">{qtd}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
