"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NA_MAO_FUNCIONARIO: { label: "Com Funcionário", color: "bg-blue-100 text-blue-800" },
  NO_DEPOSITO: { label: "No Depósito", color: "bg-green-100 text-green-800" },
  EM_MANUTENCAO: { label: "Em Manutenção", color: "bg-orange-100 text-orange-800" },
  INATIVO: { label: "Inativo", color: "bg-gray-100 text-gray-600" },
}

const CATEGORIAS: { valor: string; label: string; tipoCategoria: string }[] = [
  { valor: "EQUIPAMENTO", label: "Equipamento", tipoCategoria: "equipamento" },
  { valor: "FERRAMENTA", label: "Ferramenta", tipoCategoria: "ferramenta" },
  { valor: "ACESSORIO", label: "Acessório", tipoCategoria: "acessorio" },
]

interface Ativo {
  id: string
  codigo_interno: string
  categoria: string
  modelo: string
  marca: string
  status: string
  numero_serie?: string | null
  ano_fabricacao?: number | null
  valor?: string | null
  observacoes?: string | null
}

interface Tipo {
  id: string
  nome: string
}

interface Funcionario {
  id: string
  nome_completo: string
}

interface Codigo {
  id: string
  codigo: string
  categoria: string
  status: string
}

interface FormState {
  categoria: string
  tipo_id: string
  codigo_interno: string
  modelo: string
  marca: string
  numero_serie: string
  ano_fabricacao: string
  valor: string
  observacoes: string
  responsavel_id: string
  status: string
}

const FORM_INICIAL: FormState = {
  categoria: "EQUIPAMENTO",
  tipo_id: "",
  codigo_interno: "",
  modelo: "",
  marca: "",
  numero_serie: "",
  ano_fabricacao: "",
  valor: "",
  observacoes: "",
  responsavel_id: "",
  status: "",
}

export default function AtivosPage() {
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [desativandoId, setDesativandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [codigosDisponiveis, setCodigosDisponiveis] = useState<Codigo[]>([])
  const [usarCodigoManual, setUsarCodigoManual] = useState(false)

  const [mostrarNovoTipo, setMostrarNovoTipo] = useState(false)
  const [novoTipoNome, setNovoTipoNome] = useState("")
  const [salvandoTipo, setSalvandoTipo] = useState(false)

  function carregarAtivos() {
    api.get("/api/ativos").then((res) => setAtivos(res.data)).catch(() => {})
  }

  function carregarFuncionarios() {
    api.get("/api/funcionarios").then((res) => setFuncionarios(res.data)).catch(() => {})
  }

  function tipoCategoriaAtual() {
    return CATEGORIAS.find((c) => c.valor === form.categoria)?.tipoCategoria || "equipamento"
  }

  function carregarTipos(tipoCategoria: string) {
    api.get(`/api/tipos/${tipoCategoria}`).then((res) => setTipos(res.data)).catch(() => {})
  }

  function carregarCodigosDisponiveis(categoria: string) {
    api.get("/api/codigos", { params: { categoria, status_filtro: "DISPONIVEL" } })
      .then((res) => setCodigosDisponiveis(res.data))
      .catch(() => setCodigosDisponiveis([]))
  }

  useEffect(() => {
    setRole(getRole())
    carregarAtivos()
    carregarFuncionarios()
  }, [])

  async function desativarAtivo(a: Ativo) {
    if (!window.confirm(`Desativar ${a.codigo_interno} (${a.modelo})? Ele sai da lista de ativos e do depósito, mas o histórico de transferências e manutenções fica preservado. Da pra reativar depois pelo banco, se precisar.`)) {
      return
    }
    setDesativandoId(a.id)
    try {
      await api.put(`/api/ativos/${a.id}`, { ativo: false })
      carregarAtivos()
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Erro ao desativar ativo.")
    } finally {
      setDesativandoId(null)
    }
  }

  function abrirEdicao(a: Ativo) {
    setEditandoId(a.id)
    setErro("")
    setSucesso("")
    setForm({
      categoria: a.categoria,
      tipo_id: "",
      codigo_interno: a.codigo_interno,
      modelo: a.modelo,
      marca: a.marca,
      numero_serie: a.numero_serie || "",
      ano_fabricacao: a.ano_fabricacao ? String(a.ano_fabricacao) : "",
      valor: a.valor != null ? String(a.valor) : "",
      observacoes: a.observacoes || "",
      responsavel_id: "",
      status: a.status,
    })
    setMostrarForm(true)
  }

  function cancelarForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_INICIAL)
    setUsarCodigoManual(false)
    setErro("")
    setSucesso("")
  }

  useEffect(() => {
    if (editandoId) return
    carregarTipos(tipoCategoriaAtual())
    carregarCodigosDisponiveis(form.categoria)
    setForm((f) => ({ ...f, tipo_id: "", codigo_interno: "" }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoria])

  function atualizarCampo(campo: keyof FormState, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function criarTipo() {
    if (!novoTipoNome.trim()) return
    setSalvandoTipo(true)
    try {
      const res = await api.post(`/api/tipos/${tipoCategoriaAtual()}`, { nome: novoTipoNome.trim() })
      setNovoTipoNome("")
      setMostrarNovoTipo(false)
      await carregarTipos(tipoCategoriaAtual())
      setForm((f) => ({ ...f, tipo_id: res.data.id }))
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao criar tipo.")
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
        await api.put(`/api/ativos/${editandoId}`, {
          modelo: form.modelo,
          marca: form.marca,
          numero_serie: form.numero_serie || null,
          ano_fabricacao: form.ano_fabricacao ? Number(form.ano_fabricacao) : null,
          valor: form.valor || null,
          observacoes: form.observacoes || null,
          status: form.status || undefined,
        })
        setSucesso("Ativo atualizado.")
        cancelarForm()
        carregarAtivos()
      } catch (err: any) {
        setErro(err?.response?.data?.detail || "Erro ao atualizar ativo.")
      } finally {
        setSalvando(false)
      }
      return
    }

    if (!form.tipo_id) {
      setErro("Selecione ou cadastre um tipo.")
      return
    }
    setSalvando(true)
    try {
      await api.post("/api/ativos", {
        categoria: form.categoria,
        tipo_id: form.tipo_id,
        codigo_interno: form.codigo_interno,
        modelo: form.modelo,
        marca: form.marca,
        numero_serie: form.numero_serie || null,
        ano_fabricacao: form.ano_fabricacao ? Number(form.ano_fabricacao) : null,
        valor: form.valor || null,
        observacoes: form.observacoes || null,
        responsavel_id: form.responsavel_id || null,
      })
      setSucesso("Ativo cadastrado.")
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregarAtivos()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao cadastrar ativo.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Ativos</h1>
        <button
          onClick={() => { if (mostrarForm) { cancelarForm() } else { setForm(FORM_INICIAL); setMostrarForm(true) } }}
          className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800"
        >
          {mostrarForm ? "Cancelar" : "+ Novo Ativo"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">{sucesso}</div>
      )}

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{editandoId ? "Editar Ativo" : "Novo Ativo"}</h2>
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select disabled={!!editandoId} value={form.categoria} onChange={(e) => atualizarCampo("categoria", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500">
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Codigo interno</label>
                {!editandoId && (
                  <button type="button" onClick={() => { setUsarCodigoManual((v) => !v); atualizarCampo("codigo_interno", "") }}
                    className="text-xs text-gray-500 underline hover:text-gray-700">
                    {usarCodigoManual ? "usar etiqueta pré-impressa" : "digitar manualmente"}
                  </button>
                )}
              </div>
              {!editandoId && !usarCodigoManual ? (
                <>
                  <select required value={form.codigo_interno} onChange={(e) => atualizarCampo("codigo_interno", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Selecione um código...</option>
                    {codigosDisponiveis.map((c) => (
                      <option key={c.id} value={c.codigo}>{c.codigo}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">{codigosDisponiveis.length} etiqueta(s) disponível(eis) nesta categoria</p>
                </>
              ) : (
                <input required disabled={!!editandoId} value={form.codigo_interno} onChange={(e) => atualizarCampo("codigo_interno", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500" />
              )}
            </div>
            {!editandoId && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                <div className="flex gap-2">
                  <select value={form.tipo_id} onChange={(e) => atualizarCampo("tipo_id", e.target.value)}
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
                      placeholder="Nome do novo tipo (ex: Compactador de solo)"
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Modelo</label>
              <input required value={form.modelo} onChange={(e) => atualizarCampo("modelo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
              <input required value={form.marca} onChange={(e) => atualizarCampo("marca", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Numero de serie (opcional)</label>
              <input value={form.numero_serie} onChange={(e) => atualizarCampo("numero_serie", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ano de fabricacao (opcional)</label>
              <input type="number" value={form.ano_fabricacao} onChange={(e) => atualizarCampo("ano_fabricacao", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (opcional)</label>
              <input type="number" step="0.01" value={form.valor} onChange={(e) => atualizarCampo("valor", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {editandoId ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => atualizarCampo("status", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {Object.entries(STATUS_CONFIG).map(([valor, cfg]) => (
                    <option key={valor} value={valor}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsavel inicial (opcional)</label>
                <select value={form.responsavel_id} onChange={(e) => atualizarCampo("responsavel_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Fica no deposito</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome_completo}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observacoes (opcional)</label>
              <input value={form.observacoes} onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button disabled={salvando} type="submit"
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Salvar"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="p-3">Código</th><th className="p-3">Categoria</th>
              <th className="p-3">Modelo</th><th className="p-3">Marca</th><th className="p-3">Status</th>
              {role === "gestor" && <th className="p-3"></th>}
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
                  {role === "gestor" && (
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => abrirEdicao(a)}
                        className="text-xs text-blue-700 border border-blue-300 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                        Editar
                      </button>
                      <button disabled={desativandoId === a.id} onClick={() => desativarAtivo(a)}
                        className="text-xs text-red-700 border border-red-300 bg-red-50 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">
                        {desativandoId === a.id ? "Desativando..." : "Desativar"}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            {ativos.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-gray-400">Nenhum ativo cadastrado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
