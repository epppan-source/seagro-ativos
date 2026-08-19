"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { Pencil, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react"
import FotoUpload from "@/components/FotoUpload"

interface Material {
  id: string
  nome: string
  codigo: string
  quantidade_atual: number
  quantidade_minima: number
  unidade: string
  descricao?: string | null
  foto_url?: string | null
  responsavel_id?: string | null
}

interface Tipo {
  id: string
  nome: string
}

interface Funcionario {
  id: string
  nome_completo: string
}

interface Ativo {
  id: string
  codigo_interno: string
}

interface Movimento {
  id: string
  tipo: string
  quantidade: number
  data: string
  ativo_id: string | null
  observacao: string | null
}

interface FormState {
  nome: string
  codigo: string
  tipo_material_id: string
  descricao: string
  unidade: string
  quantidade_minima: string
  quantidade_atual: string
  responsavel_id: string
}

const FORM_INICIAL: FormState = {
  nome: "",
  codigo: "",
  tipo_material_id: "",
  descricao: "",
  unidade: "un",
  quantidade_minima: "0",
  quantidade_atual: "0",
  responsavel_id: "",
}

interface MovForm {
  tipo: "ENTRADA" | "SAIDA"
  quantidade: string
  data: string
  ativo_id: string
  observacao: string
}

const MOV_INICIAL: MovForm = {
  tipo: "SAIDA",
  quantidade: "",
  data: new Date().toISOString().slice(0, 10),
  ativo_id: "",
  observacao: "",
}

export default function MateriaisPage() {
  return (
    <Suspense fallback={null}>
      <MateriaisPageInner />
    </Suspense>
  )
}

function MateriaisPageInner() {
  const searchParams = useSearchParams()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [fotoUrlEdicao, setFotoUrlEdicao] = useState<string | null>(null)

  const [mostrarNovoTipo, setMostrarNovoTipo] = useState(false)
  const [novoTipoNome, setNovoTipoNome] = useState("")
  const [salvandoTipo, setSalvandoTipo] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])

  const [movMaterialId, setMovMaterialId] = useState<string | null>(null)
  const [movForm, setMovForm] = useState<MovForm>(MOV_INICIAL)
  const [movSalvando, setMovSalvando] = useState(false)
  const [movErro, setMovErro] = useState("")

  const [historicoMaterialId, setHistoricoMaterialId] = useState<string | null>(null)
  const [historico, setHistorico] = useState<Movimento[]>([])

  function carregarMateriais() {
    api.get("/api/materiais").then((res) => setMateriais(res.data)).catch(() => {})
  }

  function carregarTipos() {
    api.get("/api/tipos/material").then((res) => setTipos(res.data)).catch(() => {})
  }

  function carregarAtivos() {
    api.get("/api/ativos").then((res) => setAtivos(res.data)).catch(() => {})
  }

  function carregarFuncionarios() {
    api.get("/api/funcionarios").then((res) => setFuncionarios(res.data)).catch(() => {})
  }

  useEffect(() => {
    setRole(getRole())
    carregarMateriais()
    carregarTipos()
    carregarAtivos()
    carregarFuncionarios()
  }, [])

  // Abre a edição automaticamente quando chega com ?editar=ID na URL (ex: clique vindo do Dashboard)
  useEffect(() => {
    const idParaEditar = searchParams.get("editar")
    if (idParaEditar && materiais.length > 0) {
      const item = materiais.find((m) => m.id === idParaEditar)
      if (item) abrirEdicao(item)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, materiais])

  function atualizarCampo(campo: keyof FormState, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function abrirEdicao(m: Material) {
    setEditandoId(m.id)
    setFotoUrlEdicao(m.foto_url || null)
    setErro("")
    setSucesso("")
    setForm({
      nome: m.nome,
      codigo: m.codigo,
      tipo_material_id: "",
      descricao: m.descricao || "",
      unidade: m.unidade,
      quantidade_minima: String(m.quantidade_minima),
      quantidade_atual: String(m.quantidade_atual),
      responsavel_id: m.responsavel_id || "",
    })
    setMostrarForm(true)
  }

  function fotoAtualizada(url: string) {
    setFotoUrlEdicao(url)
    setMateriais((l) => l.map((x) => (x.id === editandoId ? { ...x, foto_url: url } : x)))
  }

  function cancelarForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setFotoUrlEdicao(null)
    setForm(FORM_INICIAL)
    setErro("")
    setSucesso("")
  }

  async function criarTipo() {
    if (!novoTipoNome.trim()) return
    setSalvandoTipo(true)
    try {
      const res = await api.post("/api/tipos/material", { nome: novoTipoNome.trim() })
      setNovoTipoNome("")
      setMostrarNovoTipo(false)
      await carregarTipos()
      setForm((f) => ({ ...f, tipo_material_id: res.data.id }))
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao criar tipo de material.")
    } finally {
      setSalvandoTipo(false)
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")

    if (editandoId) {
      setSalvando(true)
      try {
        await api.put(`/api/materiais/${editandoId}`, {
          nome: form.nome,
          descricao: form.descricao || null,
          quantidade_minima: form.quantidade_minima,
          responsavel_id: form.responsavel_id || null,
        })
        setSucesso("Material atualizado.")
        cancelarForm()
        carregarMateriais()
      } catch (err: any) {
        setErro(err?.response?.data?.detail || "Erro ao atualizar material.")
      } finally {
        setSalvando(false)
      }
      return
    }

    if (!form.tipo_material_id) {
      setErro("Selecione ou cadastre um tipo de material.")
      return
    }
    setSalvando(true)
    try {
      await api.post("/api/materiais", {
        nome: form.nome,
        codigo: form.codigo,
        tipo_material_id: form.tipo_material_id,
        descricao: form.descricao || null,
        unidade: form.unidade,
        quantidade_minima: form.quantidade_minima,
        quantidade_atual: form.quantidade_atual,
      })
      setSucesso("Material cadastrado.")
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregarMateriais()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao cadastrar material.")
    } finally {
      setSalvando(false)
    }
  }

  function abrirMovimento(materialId: string, tipo: "ENTRADA" | "SAIDA") {
    setMovMaterialId(materialId)
    setMovForm({ ...MOV_INICIAL, tipo })
    setMovErro("")
    setHistoricoMaterialId(null)
  }

  function cancelarMovimento() {
    setMovMaterialId(null)
    setMovForm(MOV_INICIAL)
    setMovErro("")
  }

  async function salvarMovimento(e: React.FormEvent) {
    e.preventDefault()
    if (!movMaterialId) return
    setMovErro("")

    if (!movForm.quantidade || Number(movForm.quantidade) <= 0) {
      setMovErro("Informe uma quantidade válida.")
      return
    }

    setMovSalvando(true)
    try {
      await api.post(`/api/materiais/${movMaterialId}/movimento`, {
        tipo: movForm.tipo,
        quantidade: movForm.quantidade,
        data: movForm.data,
        ativo_id: movForm.ativo_id || null,
        observacao: movForm.observacao || null,
      })
      cancelarMovimento()
      carregarMateriais()
    } catch (err: any) {
      setMovErro(err?.response?.data?.detail || "Erro ao registrar movimento.")
    } finally {
      setMovSalvando(false)
    }
  }

  function abrirHistorico(materialId: string) {
    setHistoricoMaterialId(materialId)
    setMovMaterialId(null)
    api.get(`/api/materiais/${materialId}/movimentos`)
      .then((res) => setHistorico(res.data))
      .catch(() => setHistorico([]))
  }

  function ativoLabel(ativoId: string | null) {
    if (!ativoId) return "-"
    return ativos.find((a) => a.id === ativoId)?.codigo_interno || ativoId
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Materiais</h1>
        <button
          onClick={() => { if (mostrarForm) { cancelarForm() } else { setForm(FORM_INICIAL); setMostrarForm(true) } }}
          className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark"
        >
          {mostrarForm ? "Cancelar" : "+ Novo Material"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">{sucesso}</div>
      )}

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{editandoId ? "Editar Material" : "Novo Material"}</h2>
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>}
          {editandoId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Foto</label>
              <FotoUpload url={fotoUrlEdicao} endpoint={`/api/uploads/materiais/${editandoId}/foto`} onUploaded={fotoAtualizada} />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
              <input required value={form.nome} onChange={(e) => atualizarCampo("nome", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
              <input required disabled={!!editandoId} value={form.codigo} onChange={(e) => atualizarCampo("codigo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            {!editandoId && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de material</label>
                <div className="flex gap-2">
                  <select value={form.tipo_material_id} onChange={(e) => atualizarCampo("tipo_material_id", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Selecione...</option>
                    {tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setMostrarNovoTipo((v) => !v)}
                    className="text-sm whitespace-nowrap px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    + Novo tipo
                  </button>
                </div>
                {mostrarNovoTipo && (
                  <div className="flex gap-2 mt-2">
                    <input value={novoTipoNome} onChange={(e) => setNovoTipoNome(e.target.value)}
                      placeholder="Nome do novo tipo (ex: Geomembrana PEAD)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    <button type="button" disabled={salvandoTipo} onClick={criarTipo}
                      className="text-sm whitespace-nowrap px-3 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50">
                      {salvandoTipo ? "Criando..." : "Criar"}
                    </button>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
              <input disabled={!!editandoId} value={form.unidade} onChange={(e) => atualizarCampo("unidade", e.target.value)}
                placeholder="un, m, kg, rolo..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade atual{editandoId ? " (ajuste pelo Movimento)" : ""}</label>
              <input required disabled={!!editandoId} type="number" step="0.01" value={form.quantidade_atual}
                onChange={(e) => atualizarCampo("quantidade_atual", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade mínima</label>
              <input required type="number" step="0.01" value={form.quantidade_minima}
                onChange={(e) => atualizarCampo("quantidade_minima", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição (opcional)</label>
              <input value={form.descricao} onChange={(e) => atualizarCampo("descricao", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editandoId && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
                <select value={form.responsavel_id} onChange={(e) => atualizarCampo("responsavel_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Sem responsável</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome_completo}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button disabled={salvando} type="submit"
            className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark disabled:opacity-50">
            {salvando ? "Salvando..." : editandoId ? "Salvar alterações" : "Salvar"}
          </button>
        </form>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...materiais].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((m) => {
          const pct = Math.min((m.quantidade_atual / (m.quantidade_minima * 2 || 1)) * 100, 100)
          const semEstoque = m.quantidade_atual === 0
          const baixo = !semEstoque && m.quantidade_atual <= m.quantidade_minima
          const barColor = semEstoque ? "bg-red-500" : baixo ? "bg-orange-400" : "bg-green-500"
          const badgeColor = semEstoque
            ? "bg-red-100 text-red-700"
            : baixo
            ? "bg-orange-100 text-orange-700"
            : "bg-green-100 text-green-700"
          const ativo = movMaterialId === m.id || historicoMaterialId === m.id

          return (
            <div
              key={m.id}
              className={`bg-white rounded-xl shadow flex flex-col overflow-hidden border-2 transition-colors ${ativo ? "border-seagro" : "border-transparent"}`}
            >
              {/* Foto ou placeholder */}
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                {m.foto_url ? (
                  <img src={m.foto_url} alt={m.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl select-none">📦</span>
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex flex-col flex-1 p-3 gap-2">
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{m.nome}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{m.codigo}</p>
                </div>

                {/* Badge de estoque */}
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full self-start ${badgeColor}`}>
                  {m.quantidade_atual} / {m.quantidade_minima} {m.unidade}
                </span>

                {/* Barra de estoque */}
                <div className="bg-gray-200 rounded-full h-1.5">
                  <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 gap-1 mt-auto pt-1">
                  <button
                    onClick={() => abrirMovimento(m.id, "ENTRADA")}
                    className="flex items-center justify-center gap-1 text-[11px] text-green-700 border border-green-300 bg-green-50 py-1.5 rounded-lg hover:bg-green-100"
                  >
                    <ArrowDownCircle size={11} /> Entrada
                  </button>
                  <button
                    onClick={() => abrirMovimento(m.id, "SAIDA")}
                    className="flex items-center justify-center gap-1 text-[11px] text-orange-700 border border-orange-300 bg-orange-50 py-1.5 rounded-lg hover:bg-orange-100"
                  >
                    <ArrowUpCircle size={11} /> Saída
                  </button>
                  <button
                    onClick={() => historicoMaterialId === m.id ? setHistoricoMaterialId(null) : abrirHistorico(m.id)}
                    className="flex items-center justify-center gap-1 text-[11px] text-gray-600 border border-gray-300 bg-gray-50 py-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <History size={11} /> Histórico
                  </button>
                  {role === "gestor" ? (
                    <button
                      onClick={() => abrirEdicao(m)}
                      className="flex items-center justify-center gap-1 text-[11px] text-blue-700 border border-blue-300 bg-blue-50 py-1.5 rounded-lg hover:bg-blue-100"
                    >
                      <Pencil size={11} /> Editar
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {materiais.length === 0 && (
          <p className="col-span-4 text-gray-400 text-sm">Nenhum material cadastrado ainda.</p>
        )}
      </div>

      {/* Painel de movimentação (full-width abaixo do grid) */}
      {movMaterialId && (() => {
        const m = materiais.find((x) => x.id === movMaterialId)!
        return (
          <form onSubmit={salvarMovimento} className="mt-4 bg-white rounded-xl shadow border border-seagro p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {movForm.tipo === "ENTRADA" ? "📥 Entrada de estoque" : "📤 Saída de estoque"} — {m.nome}
              </h3>
              <button type="button" onClick={cancelarMovimento} className="text-xs text-gray-400 hover:text-gray-600">✕ Fechar</button>
            </div>
            {movErro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2">{movErro}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade ({m.unidade})</label>
                <input required type="number" step="0.01" value={movForm.quantidade}
                  onChange={(e) => setMovForm((f) => ({ ...f, quantidade: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                <input required type="date" value={movForm.data}
                  onChange={(e) => setMovForm((f) => ({ ...f, data: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {movForm.tipo === "SAIDA" ? "Ativo destino (opcional)" : "Ativo de origem (opcional)"}
                </label>
                <select value={movForm.ativo_id} onChange={(e) => setMovForm((f) => ({ ...f, ativo_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Sem ativo / uso geral</option>
                  {ativos.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo_interno}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Observação (opcional)</label>
                <input value={movForm.observacao} onChange={(e) => setMovForm((f) => ({ ...f, observacao: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button disabled={movSalvando} type="submit"
                className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark disabled:opacity-50">
                {movSalvando ? "Salvando..." : "Confirmar"}
              </button>
              <button type="button" onClick={cancelarMovimento}
                className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        )
      })()}

      {/* Painel de histórico (full-width abaixo do grid) */}
      {historicoMaterialId && (() => {
        const m = materiais.find((x) => x.id === historicoMaterialId)!
        return (
          <div className="mt-4 bg-white rounded-xl shadow border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">🕐 Histórico — {m.nome}</h3>
              <button onClick={() => setHistoricoMaterialId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Fechar</button>
            </div>
            {historico.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhuma movimentação registrada.</p>
            ) : (
              <ul className="space-y-1.5">
                {historico.map((mov) => (
                  <li key={mov.id} className="text-xs text-gray-600 flex justify-between border-b border-gray-100 pb-1.5">
                    <span>
                      <span className={mov.tipo === "ENTRADA" ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                        {mov.tipo === "ENTRADA" ? "↓ Entrada" : "↑ Saída"}
                      </span>
                      {" "}{mov.quantidade} {m.unidade}
                      {mov.ativo_id ? ` · ${ativoLabel(mov.ativo_id)}` : ""}
                      {mov.observacao ? ` · ${mov.observacao}` : ""}
                    </span>
                       <span className="text-gray-400 shrink-0 ml-2">{new Date(mov.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })()}
    </div>
  )
}
