"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"

interface Transferencia {
  id: string
  ativo_id: string
  solicitante_id: string
  novo_responsavel_id: string
  status: string
  motivo_solicitacao: string | null
  solicitado_em: string
}

interface Ativo {
  id: string
  codigo_interno: string
  modelo: string
  responsavel_id: string | null
}

interface Funcionario {
  id: string
  nome_completo: string
}

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  APROVADA: "bg-green-100 text-green-800",
  REJEITADA: "bg-red-100 text-red-800",
}

export default function TransferenciasPage() {
  const [lista, setLista] = useState<Transferencia[]>([])
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [ativoId, setAtivoId] = useState("")
  const [novoResponsavelId, setNovoResponsavelId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  function carregarLista() {
    api.get("/api/transferencias").then((res) => setLista(res.data)).catch(() => {})
  }
  function carregarAtivos() {
    api.get("/api/ativos").then((res) => setAtivos(res.data)).catch(() => {})
  }
  function carregarFuncionarios() {
    api.get("/api/funcionarios").then((res) => setFuncionarios(res.data)).catch(() => {})
  }

  useEffect(() => {
    setRole(getRole())
    api.get("/api/auth/me").then((res) => setMeuId(res.data.id)).catch(() => {})
    carregarLista()
    carregarAtivos()
    carregarFuncionarios()
  }, [])

  function nomeAtivo(id: string) {
    const a = ativos.find((x) => x.id === id)
    return a ? `${a.codigo_interno} — ${a.modelo}` : id
  }
  function nomeFuncionario(id: string) {
    return funcionarios.find((f) => f.id === id)?.nome_completo || id
  }

  const ativosDisponiveis =
    role === "gestor" ? ativos : ativos.filter((a) => a.responsavel_id === meuId)

  async function decidir(id: string, aprovar: boolean) {
    await api.post(`/api/transferencias/${id}/decisao`, { aprovar })
    carregarLista()
    carregarAtivos()
  }

  async function solicitar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    if (!ativoId || !novoResponsavelId) {
      setErro("Selecione o ativo e o novo responsavel.")
      return
    }
    setSalvando(true)
    try {
      await api.post("/api/transferencias", {
        ativo_id: ativoId,
        novo_responsavel_id: novoResponsavelId,
        motivo_solicitacao: motivo || null,
      })
      setSucesso("Transferencia solicitada com sucesso. O gestor sera notificado para aprovar.")
      setAtivoId("")
      setNovoResponsavelId("")
      setMotivo("")
      setMostrarForm(false)
      carregarLista()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao solicitar transferencia.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Transferencias</h1>
        <button
          onClick={() => { setMostrarForm((v) => !v); setErro(""); setSucesso("") }}
          className="w-full sm:w-auto bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-green-800 min-h-[44px]"
        >
          {mostrarForm ? "Cancelar" : "+ Solicitar Transferencia"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">
          {sucesso}
        </div>
      )}

      {/* Formulario de solicitacao */}
      {mostrarForm && (
        <form onSubmit={solicitar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ativo</label>
            <select
              value={ativoId}
              onChange={(e) => setAtivoId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm min-h-[44px]"
            >
              <option value="">Selecione o ativo...</option>
              {ativosDisponiveis.map((a) => (
                <option key={a.id} value={a.id}>{a.codigo_interno} - {a.modelo}</option>
              ))}
            </select>
            {ativosDisponiveis.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Voce nao tem nenhum ativo sob sua responsabilidade.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Novo responsavel</label>
            <select
              value={novoResponsavelId}
              onChange={(e) => setNovoResponsavelId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm min-h-[44px]"
            >
              <option value="">Selecione o funcionario...</option>
              {funcionarios.map((f) => (
                <option key={f.id} value={f.id}>{f.nome_completo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: emprestimo para obra X"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm"
            />
          </div>
          <button
            disabled={salvando}
            type="submit"
            className="w-full bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-green-800 disabled:opacity-50 min-h-[44px]"
          >
            {salvando ? "Enviando..." : "Solicitar Transferencia"}
          </button>
        </form>
      )}

      {/* Lista de transferencias */}
      <div className="space-y-3">
        {lista.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4">
            {/* Info principal */}
            <div className="mb-3">
              <p className="font-medium text-gray-800 text-sm leading-snug">
                {nomeAtivo(t.ativo_id)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{nomeFuncionario(t.solicitante_id)}</span>
                {" "}→{" "}
                <span className="font-medium">{nomeFuncionario(t.novo_responsavel_id)}</span>
              </p>
              {t.motivo_solicitacao && (
                <p className="text-xs text-gray-400 mt-1 italic">{t.motivo_solicitacao}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(t.solicitado_em).toLocaleString("pt-BR")}
              </p>
            </div>
            {/* Status + acoes */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  STATUS_STYLE[t.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {t.status}
              </span>
              {role === "gestor" && t.status === "PENDENTE" && (
                <>
                  <button
                    onClick={() => decidir(t.id, true)}
                    className="flex-1 sm:flex-none text-sm bg-green-600 text-white px-4 py-2 rounded-lg min-h-[44px] hover:bg-green-700"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => decidir(t.id, false)}
                    className="flex-1 sm:flex-none text-sm bg-red-600 text-white px-4 py-2 rounded-lg min-h-[44px] hover:bg-red-700"
                  >
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Nenhuma transferencia registrada.</p>
        )}
      </div>
    </div>
  )
}
