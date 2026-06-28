"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Wrench, Archive, Warehouse, User, ChevronDown, ChevronUp, AlertTriangle, LucideIcon } from "lucide-react"

interface AtivoResumo {
  id: string
  codigo_interno: string
  categoria: string
  modelo: string
  marca: string
  status: string
}

interface ItemEstoque {
  id: string
  codigo: string
  nome: string
  quantidade_atual: number
  quantidade_minima: number
  unidade: string
  baixo_estoque: boolean
}

interface FuncionarioCard {
  funcionario: { id: string; nome_completo: string; cargo: string }
  total_itens: number
  ativos: AtivoResumo[]
  materiais: ItemEstoque[]
  pecas: ItemEstoque[]
}

interface Painel {
  deposito: { total: number; ativos: AtivoResumo[] }
  funcionarios: FuncionarioCard[]
  manutencao: { total: number; ativos: AtivoResumo[]; manutencoes_agendadas: number }
  materiais: {
    total_estoque: number
    total_baixo_estoque: number
    baixo_estoque: ItemEstoque[]
    materiais: ItemEstoque[]
    pecas: ItemEstoque[]
  }
}

// Cores da identidade visual SEAGRO
const VERDE = "#2E7D32"
const VERDE_ESCURO = "#0d3d2e"
const VERDE_BG = "#E8F5E9"
const ALERTA = "#C62828"
const ALERTA_BG = "#FDECEA"

export default function DashboardPage() {
  const [painel, setPainel] = useState<Painel | null>(null)
  const [abertoFuncionario, setAbertoFuncionario] = useState<string | null>(null)
  const [abertoFixo, setAbertoFixo] = useState<string | null>(null)

  useEffect(() => {
    api.get("/api/dashboard/painel").then((res) => setPainel(res.data)).catch(() => {})
  }, [])

  if (!painel) return <p className="text-gray-500">Carregando...</p>

  const itensEstoque = [...painel.materiais.materiais, ...painel.materiais.pecas]

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: VERDE_ESCURO }}>Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CardExpansivel
          titulo="Depósito"
          subtitulo={`${painel.deposito.total} ativo(s) no depósito`}
          icone={Warehouse}
          aberto={abertoFixo === "deposito"}
          onToggle={() => setAbertoFixo(abertoFixo === "deposito" ? null : "deposito")}
        >
          <ListaAtivos ativos={painel.deposito.ativos} />
        </CardExpansivel>

        <CardExpansivel
          titulo="Manutenção"
          subtitulo={`${painel.manutencao.total} em manutenção · ${painel.manutencao.manutencoes_agendadas} agendada(s)`}
          icone={Wrench}
          aberto={abertoFixo === "manutencao"}
          onToggle={() => setAbertoFixo(abertoFixo === "manutencao" ? null : "manutencao")}
        >
          <ListaAtivos ativos={painel.manutencao.ativos} />
        </CardExpansivel>

        <CardExpansivel
          titulo="Materiais (estoque)"
          subtitulo={`${painel.materiais.total_estoque} item(ns) · ${painel.materiais.total_baixo_estoque} em baixo estoque`}
          icone={Archive}
          destaque={painel.materiais.total_baixo_estoque > 0}
          aberto={abertoFixo === "materiais"}
          onToggle={() => setAbertoFixo(abertoFixo === "materiais" ? null : "materiais")}
        >
          <ListaEstoque itens={itensEstoque} />
        </CardExpansivel>

        {painel.funcionarios.map((f) => (
          <CardExpansivel
            key={f.funcionario.id}
            titulo={f.funcionario.nome_completo}
            subtitulo={`${f.funcionario.cargo} · ${f.total_itens} item(ns) na mão`}
            icone={User}
            aberto={abertoFuncionario === f.funcionario.id}
            onToggle={() => setAbertoFuncionario(abertoFuncionario === f.funcionario.id ? null : f.funcionario.id)}
          >
            {f.total_itens === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhum item no momento.</p>
            ) : (
              <div className="space-y-3">
                {f.ativos.length > 0 && <ListaAtivos titulo="Ativos" ativos={f.ativos} />}
                {f.materiais.length > 0 && <ListaEstoque titulo="Materiais" itens={f.materiais} />}
                {f.pecas.length > 0 && <ListaEstoque titulo="Peças de reposição" itens={f.pecas} />}
              </div>
            )}
          </CardExpansivel>
        ))}
      </div>
    </div>
  )
}

function CardExpansivel({
  titulo,
  subtitulo,
  icone: Icone,
  aberto,
  onToggle,
  destaque,
  children,
}: {
  titulo: string
  subtitulo: string
  icone: LucideIcon
  aberto: boolean
  onToggle: () => void
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full" style={{ backgroundColor: destaque ? ALERTA_BG : VERDE_BG }}>
            <Icone className="h-5 w-5" style={{ color: destaque ? ALERTA : VERDE }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: VERDE_ESCURO }}>{titulo}</p>
            <p className="text-xs text-gray-500">{subtitulo}</p>
          </div>
        </div>
        {aberto ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {aberto && <div className="border-t border-gray-100 p-4 max-h-80 overflow-y-auto">{children}</div>}
    </div>
  )
}

function ListaAtivos({ titulo, ativos }: { titulo?: string; ativos: AtivoResumo[] }) {
  if (ativos.length === 0) return <p className="text-sm text-gray-400 italic">Nenhum ativo.</p>
  return (
    <div>
      {titulo && <p className="text-xs font-semibold text-gray-500 mb-1">{titulo}</p>}
      <ul className="space-y-1 text-sm">
        {ativos.map((a) => (
          <li key={a.id} className="flex justify-between border-b py-1">
            <span>{a.codigo_interno} — {a.marca} {a.modelo}</span>
            <span className="text-gray-400 text-xs">{a.categoria}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ListaEstoque({ titulo, itens }: { titulo?: string; itens: ItemEstoque[] }) {
  if (itens.length === 0) return <p className="text-sm text-gray-400 italic">Nenhum item.</p>
  return (
    <div>
      {titulo && <p className="text-xs font-semibold text-gray-500 mb-1">{titulo}</p>}
      <ul className="space-y-1 text-sm">
        {itens.map((i) => (
          <li key={i.id} className="flex justify-between border-b py-1">
            <span className="flex items-center gap-1">
              {i.baixo_estoque && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {i.nome}
            </span>
            <span className={i.baixo_estoque ? "text-red-600 font-medium" : "text-gray-600"}>
              {i.quantidade_atual} {i.unidade}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
