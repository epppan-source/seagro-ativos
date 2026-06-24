"use client"
import { useEffect, useRef, useState } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { Pencil, Archive, X, FileText, Download } from "lucide-react"

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

const TIPOS_DOCUMENTO: { valor: string; label: string }[] = [
  { valor: "CALIBRACAO", label: "Calibração" },
  { valor: "NOTA_FISCAL", label: "Nota Fiscal" },
  { valor: "CERTIFICADO", label: "Certificado" },
  { valor: "MANUAL", label: "Manual" },
  { valor: "GARANTIA", label: "Garantia" },
  { valor: "OUTRO", label: "Outro" },
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
  data_revisao_prevista?: string | null
  aposentado_em?: string | null
  motivo_aposentadoria?: string | null
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

interface Codigo {
  id: string
  codigo: string
  categoria: string
  status: string
}

interface Foto {
  id: string
  url: string
  descricao: string | null
}

interface Documento {
  id: string
  nome: string
  tipo_documento: string
  arquivo_url: string
  nome_arquivo_original: string | null
  created_at: string
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
  data_revisao_prevista: string
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
  data_revisao_prevista: "",
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
  const [aposentandoId, setAposentandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [codigosDisponiveis, setCodigosDisponiveis] = useState<Codigo[]>([])
  const [usarCodigoManual, setUsarCodigoManual] = useState(false)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState("")
  const inputFotoRef = useRef<HTMLInputElement>(null)
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)

  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [enviandoDocumento, setEnviandoDocumento] = useState(false)
  const [erroDocumento, setErroDocumento] = useState("")
  const [novoDocNome, setNovoDocNome] = useState("")
  const [novoDocTipo, setNovoDocTipo] = useState("CALIBRACAO")
  const inputDocRef = useRef<HTMLInputElement>(null)

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

  async function aposentarAtivo(a: Ativo) {
    if (!window.confirm(`Aposentar ${a.codigo_interno} (${a.modelo})? Ele sai da lista de ativos ativos e do depósito, mas o histórico de transferências e manutenções fica preservado. Da pra reativar depois pelo banco, se precisar.`)) {
      return
    }
    const motivo = window.prompt("Motivo da aposentadoria (opcional, ex: desgaste, quebra irreparável):", "") || ""
    setAposentandoId(a.id)
    try {
      await api.put(`/api/ativos/${a.id}`, {
        ativo: false,
        status: "INATIVO",
        aposentado_em: new Date().toISOString().slice(0, 10),
        motivo_aposentadoria: motivo || null,
      })
      carregarAtivos()
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Erro ao aposentar ativo.")
    } finally {
      setAposentandoId(null)
    }
  }

  function carregarFotos(ativoId: string) {
    api.get(`/api/uploads/ativos/${ativoId}/fotos`).then((res) => setFotos(res.data)).catch(() => {})
  }

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !editandoId) return
    if (fotos.length >= 3) {
      setErroFoto("Limite de 3 fotos por ativo. Remova uma foto antes de adicionar outra.")
      if (inputFotoRef.current) inputFotoRef.current.value = ""
      return
    }
    setErroFoto("")
    setEnviandoFoto(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      await api.post(`/api/uploads/ativos/${editandoId}/foto`, formData)
      carregarFotos(editandoId)
    } catch (err: any) {
      setErroFoto(err?.response?.data?.detail || "Erro ao enviar foto.")
    } finally {
      setEnviandoFoto(false)
      if (inputFotoRef.current) inputFotoRef.current.value = ""
    }
  }

  async function removerFoto(fotoId: string) {
    if (!window.confirm("Remover esta foto do ativo?")) return
    try {
      await api.delete(`/api/uploads/ativos/fotos/${fotoId}`)
      setFotos((f) => f.filter((x) => x.id !== fotoId))
    } catch {
      alert("Erro ao remover foto.")
    }
  }

  function carregarDocumentos(ativoId: string) {
    api.get(`/api/uploads/ativos/${ativoId}/documentos`).then((res) => setDocumentos(res.data)).catch(() => {})
  }

  async function enviarDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo || !editandoId) return
    setErroDocumento("")
    setEnviandoDocumento(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      formData.append("nome", novoDocNome.trim() || arquivo.name)
      formData.append("tipo_documento", novoDocTipo)
      await api.post(`/api/uploads/ativos/${editandoId}/documento`, formData)
      carregarDocumentos(editandoId)
      setNovoDocNome("")
    } catch (err: any) {
      setErroDocumento(err?.response?.data?.detail || "Erro ao enviar documento.")
    } finally {
      setEnviandoDocumento(false)
      if (inputDocRef.current) inputDocRef.current.value = ""
    }
  }

  async function removerDocumento(documentoId: string) {
    if (!window.confirm("Remover este documento do ativo?")) return
    try {
      await api.delete(`/api/uploads/ativos/documentos/${documentoId}`)
      setDocumentos((d) => d.filter((x) => x.id !== documentoId))
    } catch {
      alert("Erro ao remover documento.")
    }
  }

  function abrirEdicao(a: Ativo) {
    setEditandoId(a.id)
    setErro("")
    setSucesso("")
    setErroFoto("")
    setErroDocumento("")
    carregarFotos(a.id)
    carregarDocumentos(a.id)
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
      responsavel_id: a.responsavel_id || "",
      status: a.status,
      data_revisao_prevista: a.data_revisao_prevista || "",
    })
    setMostrarForm(true)
  }

  function cancelarForm() {
    setMostrarForm(false)
    setEditandoId(null)
    setForm(FORM_INICIAL)
    setUsarCodigoManual(false)
    setFotos([])
    setDocumentos([])
    setErroFoto("")
    setErroDocumento("")
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
          categoria: form.categoria,
          modelo: form.modelo,
          marca: form.marca,
          numero_serie: form.numero_serie || null,
          ano_fabricacao: form.ano_fabricacao ? Number(form.ano_fabricacao) : null,
          valor: form.valor || null,
          observacoes: form.observacoes || null,
          status: form.status || undefined,
          responsavel_id: form.responsavel_id || null,
          data_revisao_prevista: form.data_revisao_prevista || null,
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
          className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark"
        >
          {mostrarForm ? "Cancelar" : "+ Novo Ativo"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">{sucesso}</div>
      )}

      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out">
          <img src={fotoAmpliada} alt="Foto ampliada" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{editandoId ? "Editar Ativo" : "Novo Ativo"}</h2>
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>}
          {editandoId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Fotos</label>
                <div>
                  <input ref={inputFotoRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={enviarFoto} className="hidden" />
                  <button type="button" disabled={enviandoFoto || fotos.length >= 3} onClick={() => inputFotoRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                    {enviandoFoto ? "Enviando..." : "+ Adicionar foto"}
                  </button>
                </div>
              </div>
              {erroFoto && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 mb-2">{erroFoto}</div>}
              {fotos.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma foto cadastrada ainda.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {fotos.map((f) => (
                    <div key={f.id} className="relative group">
                      <button type="button" onClick={() => setFotoAmpliada(f.url)} className="block w-full">
                        <img src={f.url} alt={f.descricao || "Foto do ativo"}
                          className="w-full h-36 object-contain bg-gray-50 rounded-lg border border-gray-200" />
                      </button>
                      <button type="button" onClick={() => removerFoto(f.id)} title="Remover foto"
                        className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 shadow opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Clique em uma foto para ampliar. Máximo de 3 fotos por ativo ({fotos.length}/3).</p>
            </div>
          )}
          {editandoId && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Documentos (calibração, NF, manual, etc.)</label>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <input value={novoDocNome} onChange={(e) => setNovoDocNome(e.target.value)}
                  placeholder="Nome do documento (ex: Calibração 06/2026)"
                  className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
                <select value={novoDocTipo} onChange={(e) => setNovoDocTipo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t.valor} value={t.valor}>{t.label}</option>
                  ))}
                </select>
                <input ref={inputDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={enviarDocumento} className="hidden" />
                <button type="button" disabled={enviandoDocumento} onClick={() => inputDocRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
                  {enviandoDocumento ? "Enviando..." : "+ Anexar arquivo"}
                </button>
              </div>
              {erroDocumento && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 mb-2">{erroDocumento}</div>}
              {documentos.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum documento anexado ainda.</p>
              ) : (
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                  {documentos.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{d.nome}</p>
                          <p className="text-xs text-gray-400">{TIPOS_DOCUMENTO.find((t) => t.valor === d.tipo_documento)?.label || d.tipo_documento}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer" title="Abrir/baixar"
                          className="text-gray-500 hover:text-seagro">
                          <Download size={14} />
                        </a>
                        <button type="button" onClick={() => removerDocumento(d.id)} title="Remover documento"
                          className="text-red-500 hover:text-red-700">
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select value={form.categoria} onChange={(e) => atualizarCampo("categoria", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>{c.label}</option>
                ))}
              </select>
              {editandoId && (
                <p className="text-xs text-gray-400 mt-1">Atenção: ao trocar a categoria, o tipo específico cadastrado não muda automaticamente.</p>
              )}
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
            {editandoId && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => atualizarCampo("status", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(STATUS_CONFIG).map(([valor, cfg]) => (
                      <option key={valor} value={valor}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data prevista de revisão (opcional)</label>
                  <input type="date" value={form.data_revisao_prevista} onChange={(e) => atualizarCampo("data_revisao_prevista", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{editandoId ? "Responsável" : "Responsavel inicial (opcional)"}</label>
              <select value={form.responsavel_id} onChange={(e) => atualizarCampo("responsavel_id", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Fica no deposito</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome_completo}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Observacoes (opcional)</label>
              <input value={form.observacoes} onChange={(e) => atualizarCampo("observacoes", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button disabled={salvando} type="submit"
            className="bg-seagro text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-seagro-dark disabled:opacity-50">
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
                        className="inline-flex items-center gap-1 text-xs text-blue-700 border border-blue-300 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                        <Pencil size={12} /> Editar
                      </button>
                      <button disabled={aposentandoId === a.id} onClick={() => aposentarAtivo(a)}
                        className="inline-flex items-center gap-1 text-xs text-red-700 border border-red-300 bg-red-50 px-2 py-1 rounded hover:bg-red-100 disabled:opacity-50">
                        <Archive size={12} /> {aposentandoId === a.id ? "Aposentando..." : "Aposentar"}
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
