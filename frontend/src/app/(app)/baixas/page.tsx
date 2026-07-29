"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { CheckCircle, XCircle, Clock } from "lucide-react"

interface FuncionarioSimples {
  id: string
  nome_completo: string
  email: string
}

interface ItemSimples {
  id: string
  nome: string
  unidade: string
}

interface SolicitacaoBaixa {
  id: string
  solicitante: FuncionarioSimples
  tipo_item: "MATERIAL" | "PECA"
  material: ItemSimples | null
  peca: ItemSimples | null
  quantidade: number
  obra: string
  status: "PENDENTE" | "APROVADA" | "REJEITADA"
  aprovador: FuncionarioSimples | null
  motivo_rejeicao: string | null
  solicitado_em: string
  aprovado_rejeitado_em: string | null
}

interface MaterialItem {
  id: string
  nome: string
  unidade: string
  quantidade_atual: number
}

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  APROVADA: { label: "Aprovada", color: "bg-green-100 text-green-800", icon: CheckCircle },
  REJEITADA: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function BaixasPage() {
  const [role, setRole] = useState<string | null>(null)
  const [baixas, setBaixas] = useState<SolicitacaoBaixa[]>([])
  const [materiais, setMateriais] = useState<MaterialItem[]>([])
  const [pecas, setPecas] = useState<MaterialItem[]>([])
  const [carregando, setCarregando] = useState(true)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [tipoItem, setTipoItem] = useState<"MATERIAL" | "PECA">("MATERIAL")
  const [itemId, setItemId] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [obra, setObra] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const [rejeitandoId, setRejeitandoId] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [decidindo, setDecidindo] = useState<string | null>(null)

  const [aba, setAba] = useState<"pendentes" | "todas">("pendentes")

  function carregar() {
    api.get("/api/baixas").then((res) => setBaixas(res.data)).catch(() => {}).finally(() => setCarregando(false))
  }

  useEffect(() => {
    setRole(getRole())
    carregar()
    api.get("/api/materiais").then((res) => setMateriais(res.data)).catch(() => {})
    api.get("/api/pecas").then((res) => setPecas(res.data)).catch(() => {})
  }, [])

  const itens = tipoItem === "MATERIAL" ? materiais : pecas
  const itemSelecionado = itens.find((i) => i.id === itemId)

  async function solicitar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    if (!itemId) { setErro("Selecione um item."); return }
    if (!quantidade || Number(quantidade) <= 0) { setErro("Informe uma quantidade válida."); return }
    if (!obra.trim()) { setErro("Informe a obra ou destino."); return }
    setSalvando(true)
    try {
      await api.post("/api/baixas", {
        tipo_item: tipoItem,
        material_id: tipoItem === "MATERIAL" ? itemId : null,
        peca_id: tipoItem === "PECA" ? itemId : null,
        quantidade: Number(quantidade),
        obra: obra.trim(),
      })
      setSucesso("Solicitação enviada! Aguardando aprovação do gestor.")
      setMostrarForm(false)
      setItemId("")
      setQuantidade("")
      setObra("")
      carregar()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao enviar solicitação.")
    } finally {
      setSalvando(false)
    }
  }

  async function decidir(id: string, aprovar: boolean) {
    if (!aprovar && !motivoRejeicao.trim()) {
      setErro("Informe o motivo da rejeição.")
      return
    }
    setDecidindo(id)
    setErro("")
    try {
      await api.post(`/api/baixas/${id}/decisao`, {
        aprovar,
        motivo_rejeicao: aprovar ? null : motivoRejeicao.trim(),
      })
      setRejeitandoId(null)
      setMotivoRejeicao("")
      carregar()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao processar decisão.")
    } finally {
      setDecidindo(null)
    }
  }

  const baixasFiltradas = aba === "pendentes"
    ? baixas.filter((b) => b.status === "PENDENTE")
    : baixas

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Baixas de Estoque</h1>
        {!mostrarForm && (
          <button
            onClick={() => { setMostrarForm(true); setErro(""); setSucesso("") }}
            className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark"
          >
            + Nova Solicitação
          </button>
        )}
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">{sucesso}</div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{erro}</div>
      )}

      {mostrarForm && (
        <form onSubmit={solicitar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Nova Solicitação de Baixa</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de item</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setTipoItem("MATERIAL"); setItemId("") }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${tipoItem === "MATERIAL" ? "bg-seagro text-white border-seagro" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Material
              </button>
              <button
                type="button"
                onClick={() => { setTipoItem("PECA"); setItemId("") }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${tipoItem === "PECA" ? "bg-seagro text-white border-seagro" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                Peça de Reposição
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {tipoItem === "MATERIAL" ? "Material" : "Peça de Reposição"}
            </label>
            <select
              required
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Selecione...</option>
              {itens.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome} — estoque atual: {i.quantidade_atual} {i.unidade}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantidade {itemSelecionado ? `(${itemSelecionado.unidade})` : ""}
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {itemSelecionado && (
                <p className="text-xs text-gray-400 mt-1">Disponível: {itemSelecionado.quantidade_atual} {itemSelecionado.unidade}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Obra / Destino</label>
              <input
                required
                value={obra}
                onChange={(e) => setObra(e.target.value)}
                placeholder="Ex: Obra Fazenda Santa Maria"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark disabled:opacity-50"
            >
              {salvando ? "Enviando..." : "Solicitar baixa"}
            </button>
            <button
              type="button"
              onClick={() => { setMostrarForm(false); setErro("") }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {role === "gestor" && (
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setAba("pendentes")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${aba === "pendentes" ? "bg-seagro text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            Pendentes {baixas.filter((b) => b.status === "PENDENTE").length > 0 && (
              <span className="ml-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">
                {baixas.filter((b) => b.status === "PENDENTE").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setAba("todas")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${aba === "todas" ? "bg-seagro text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            Todas
          </button>
        </div>
      )}

      {carregando ? (
        <p className="text-gray-400 text-sm">Carregando...</p>
      ) : baixasFiltradas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          {aba === "pendentes" ? "Nenhuma solicitação pendente." : "Nenhuma solicitação registrada ainda."}
        </div>
      ) : (
        <div className="space-y-3">
          {baixasFiltradas.map((b) => {
            const cfg = STATUS_CONFIG[b.status]
            const Icon = cfg.icon
            const nomeItem = b.material?.nome ?? b.peca?.nome ?? "—"
            const unidade = b.material?.unidade ?? b.peca?.unidade ?? ""
            const isRejeitando = rejeitandoId === b.id

            return (
              <div key={b.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(b.solicitado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {b.tipo_item === "MATERIAL" ? "Material" : "Peça"}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800">{nomeItem}</p>
                    <p className="text-sm text-gray-600">
                      Quantidade: <strong>{b.quantidade} {unidade}</strong> &nbsp;·&nbsp; Obra: <strong>{b.obra}</strong>
                    </p>
                    {role === "gestor" && (
                      <p className="text-xs text-gray-500">Solicitado por: {b.solicitante.nome_completo}</p>
                    )}
                    {b.aprovador && (
                      <p className="text-xs text-gray-500">
                        {b.status === "APROVADA" ? "Aprovado" : "Rejeitado"} por: {b.aprovador.nome_completo}
                        {b.aprovado_rejeitado_em && ` em ${new Date(b.aprovado_rejeitado_em).toLocaleDateString("pt-BR")}`}
                      </p>
                    )}
                    {b.motivo_rejeicao && (
                      <p className="text-xs text-red-600">Motivo: {b.motivo_rejeicao}</p>
                    )}
                  </div>

                  {role === "gestor" && b.status === "PENDENTE" && (
                    <div className="flex flex-col gap-2 sm:items-end shrink-0">
                      {!isRejeitando ? (
                        <div className="flex gap-2">
                          <button
                            disabled={decidindo === b.id}
                            onClick={() => decidir(b.id, true)}
                            className="inline-flex items-center gap-1 text-xs text-green-700 border border-green-300 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 disabled:opacity-50 min-h-[36px]"
                          >
                            <CheckCircle size={13} /> Aprovar
                          </button>
                          <button
                            onClick={() => { setRejeitandoId(b.id); setMotivoRejeicao(""); setErro("") }}
                            className="inline-flex items-center gap-1 text-xs text-red-700 border border-red-300 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 min-h-[36px]"
                          >
                            <XCircle size={13} /> Rejeitar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full sm:w-64">
                          <input
                            autoFocus
                            value={motivoRejeicao}
                            onChange={(e) => setMotivoRejeicao(e.target.value)}
                            placeholder="Motivo da rejeição..."
                            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={decidindo === b.id}
                              onClick={() => decidir(b.id, false)}
                              className="flex-1 text-xs text-red-700 border border-red-300 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              {decidindo === b.id ? "Rejeitando..." : "Confirmar rejeição"}
                            </button>
                            <button
                              onClick={() => setRejeitandoId(null)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
