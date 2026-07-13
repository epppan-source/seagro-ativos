"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { FileText, User } from "lucide-react"

interface Funcionario {
  id: string
  nome_completo: string
  cargo: string
  email: string
  cpf: string
}

interface Ativo {
  id: string
  codigo_interno: string
  modelo: string
  marca: string
  responsavel_id: string | null
  status: string
}

export default function TermosPage() {
  const router = useRouter()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const role = getRole()
    if (role !== "gestor") {
      router.push("/dashboard")
      return
    }
    Promise.all([
      api.get("/api/funcionarios").then((r) => r.data),
      api.get("/api/ativos").then((r) => r.data),
    ]).then(([funcs, ats]) => {
      setFuncionarios(funcs.filter((f: any) => f.role !== "gestor"))
      setAtivos(ats)
    }).finally(() => setCarregando(false))
  }, [])

  function ativosDoFuncionario(funcId: string) {
    return ativos.filter((a) => a.responsavel_id === funcId)
  }

  if (carregando) return <p className="text-gray-400 text-sm">Carregando...</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Termos de Responsabilidade</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gere o termo por funcionário, salve como PDF e envie pelo Intuix para assinatura digital.
        </p>
      </div>

      <div className="space-y-3">
        {funcionarios.map((f) => {
          const meus = ativosDoFuncionario(f.id)
          return (
            <div key={f.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-full p-2">
                  <User size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{f.nome_completo}</p>
                  <p className="text-xs text-gray-500">{f.cargo} · {meus.length} ativo{meus.length !== 1 ? "s" : ""} atribuído{meus.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/termos/${f.id}`)}
                disabled={meus.length === 0}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-seagro text-white hover:bg-seagro-dark disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText size={14} /> Gerar Termo
              </button>
            </div>
          )
        })}
        {funcionarios.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhum funcionário cadastrado.</p>
        )}
      </div>
    </div>
  )
}
