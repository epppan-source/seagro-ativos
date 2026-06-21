"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NA_MAO_FUNCIONARIO: { label: "Com Funcionário", color: "bg-blue-100 text-blue-800" },
  NO_DEPOSITO: { label: "No Depósito", color: "bg-green-100 text-green-800" },
  EM_MANUTENCAO: { label: "Em Manutenção", color: "bg-orange-100 text-orange-800" },
  INATIVO: { label: "Inativo", color: "bg-gray-100 text-gray-600" },
}

const CATEGORIA_LABEL: Record<string, { label: string; tipoCategoria: string }> = {
  EQUIPAMENTO: { label: "Equipamento", tipoCategoria: "equipamento" },
  FERRAMENTA: { label: "Ferramenta", tipoCategoria: "ferramenta" },
  ACESSORIO: { label: "Acessório", tipoCategoria: "acessorio" },
}

interface Ativo {
  id: string
  codigo_interno: string
  categoria: string
  tipo_id: string
  modelo: string
  marca: string
  numero_serie: string | null
  ano_fabricacao: number | null
  valor: string | null
  status: string
  responsavel_id: string | null
  observacoes: string | null
  ativo: boolean
  created_at: string
}

export default function FichaAtivoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ativo, setAtivo] = useState<Ativo | null>(null)
  const [tipoNome, setTipoNome] = useState("")
  const [responsavelNome, setResponsavelNome] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    api
      .get(`/api/ativos/${params.id}`)
      .then(async (res) => {
        const a: Ativo = res.data
        setAtivo(a)

        const tipoCategoria = CATEGORIA_LABEL[a.categoria]?.tipoCategoria || "equipamento"
        api
          .get(`/api/tipos/${tipoCategoria}`)
          .then((r) => {
            const t = r.data.find((x: any) => x.id === a.tipo_id)
            if (t) setTipoNome(t.nome)
          })
          .catch(() => {})

        if (a.responsavel_id) {
          api
            .get("/api/funcionarios")
            .then((r) => {
              const f = r.data.find((x: any) => x.id === a.responsavel_id)
              if (f) setResponsavelNome(f.nome_completo)
            })
            .catch(() => {})
        }
      })
      .catch((err) => {
        setErro(err?.response?.status === 404 ? "Ativo não encontrado." : "Erro ao carregar ativo.")
      })
      .finally(() => setCarregando(false))
  }, [params.id])

  if (carregando) {
    return <div className="text-sm text-gray-500">Carregando...</div>
  }

  if (erro || !ativo) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
        {erro || "Ativo não encontrado."}
        <div className="mt-3">
          <button onClick={() => router.push("/ativos")} className="text-sm text-red-800 underline">
            Voltar para a lista de ativos
          </button>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[ativo.status] || { label: ativo.status, color: "bg-gray-100 text-gray-600" }
  const categoriaInfo = CATEGORIA_LABEL[ativo.categoria]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{ativo.codigo_interno}</h1>
          <p className="text-sm text-gray-500">{categoriaInfo?.label || ativo.categoria}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {!ativo.ativo && (
        <div className="bg-gray-100 border border-gray-300 text-gray-600 text-sm rounded-lg p-3 mb-4">
          Este ativo está desativado.
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-5">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Tipo</dt>
            <dd className="font-medium text-gray-800">{tipoNome || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Modelo</dt>
            <dd className="font-medium text-gray-800">{ativo.modelo}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Marca</dt>
            <dd className="font-medium text-gray-800">{ativo.marca}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Número de série</dt>
            <dd className="font-medium text-gray-800">{ativo.numero_serie || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Ano de fabricação</dt>
            <dd className="font-medium text-gray-800">{ativo.ano_fabricacao || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Valor</dt>
            <dd className="font-medium text-gray-800">{ativo.valor ? `R$ ${ativo.valor}` : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Responsável atual</dt>
            <dd className="font-medium text-gray-800">{responsavelNome || "No depósito"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Cadastrado em</dt>
            <dd className="font-medium text-gray-800">{new Date(ativo.created_at).toLocaleDateString("pt-BR")}</dd>
          </div>
          {ativo.observacoes && (
            <div className="md:col-span-2">
              <dt className="text-xs text-gray-500">Observações</dt>
              <dd className="font-medium text-gray-800">{ativo.observacoes}</dd>
            </div>
          )}
        </dl>
      </div>

      <button onClick={() => router.push("/ativos")} className="mt-4 text-sm text-green-700 hover:underline">
        ← Voltar para a lista de ativos
      </button>
    </div>
  )
}
