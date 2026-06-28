"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Pencil } from "lucide-react"
import FotoUpload from "@/components/FotoUpload"

interface Funcionario {
  id: string
  nome_completo: string
  login: string
  email: string
  cargo: string
  telefone: string | null
  role: string
  ativo: boolean
  foto_url?: string | null
}

interface FormState {
  nome_completo: string
  cpf: string
  cargo: string
  telefone: string
  email: string
  login: string
  senha_provisoria: string
  role: "funcionario" | "gestor"
}

interface EditState {
  nome_completo: string
  cargo: string
  telefone: string
  email: string
  role: "funcionario" | "gestor"
  foto_url: string | null
}

const FORM_INICIAL: FormState = {
  nome_completo: "",
  cpf: "",
  cargo: "",
  telefone: "",
  email: "",
  login: "",
  senha_provisoria: "",
  role: "funcionario",
}

export default function FuncionariosPage() {
  const [lista, setLista] = useState<Funcionario[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditState | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [desativando, setDesativando] = useState(false)
  const [erroEdicao, setErroEdicao] = useState("")

  function carregar() {
    api.get("/api/funcionarios").then((res) => setLista(res.data)).catch(() => {})
  }

  useEffect(() => {
    carregar()
  }, [])

  function atualizarCampo(campo: keyof FormState, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    setSalvando(true)
    try {
      await api.post("/api/funcionarios", form)
      setSucesso(`Funcionario cadastrado. Login: ${form.login} / Senha provisoria: ${form.senha_provisoria}. Passe essa senha pra ele por WhatsApp ou verbalmente — ele vai trocar no primeiro acesso.`)
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregar()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao cadastrar funcionario.")
    } finally {
      setSalvando(false)
    }
  }

  function abrirEdicao(f: Funcionario) {
    setMostrarForm(false)
    setErroEdicao("")
    setEditandoId(f.id)
    setEditForm({
      nome_completo: f.nome_completo,
      cargo: f.cargo,
      telefone: f.telefone || "",
      email: f.email,
      role: f.role as "funcionario" | "gestor",
      foto_url: f.foto_url || null,
    })
  }

  function fotoAtualizada(url: string) {
    if (!editandoId) return
    setEditForm((f) => (f ? { ...f, foto_url: url } : f))
    setLista((l) => l.map((x) => (x.id === editandoId ? { ...x, foto_url: url } : x)))
  }

  function fecharEdicao() {
    setEditandoId(null)
    setEditForm(null)
    setErroEdicao("")
  }

  function atualizarCampoEdicao(campo: keyof EditState, valor: string) {
    setEditForm((f) => (f ? { ...f, [campo]: valor } : f))
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId || !editForm) return
    setErroEdicao("")
    setSalvandoEdicao(true)
    try {
      await api.put(`/api/funcionarios/${editandoId}`, editForm)
      fecharEdicao()
      carregar()
    } catch (err: any) {
      setErroEdicao(err?.response?.data?.detail || "Erro ao salvar alteracoes.")
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function desativarFuncionario() {
    if (!editandoId) return
    const nome = editForm?.nome_completo || "este funcionario"
    if (!window.confirm(`Desativar ${nome}? Ele nao vai mais conseguir entrar no sistema, mas o historico de ativos e transferencias dele fica preservado. Da pra reativar depois, se precisar.`)) {
      return
    }
    setDesativando(true)
    setErroEdicao("")
    try {
      await api.put(`/api/funcionarios/${editandoId}`, { ativo: false })
      fecharEdicao()
      carregar()
    } catch (err: any) {
      setErroEdicao(err?.response?.data?.detail || "Erro ao desativar funcionario.")
    } finally {
      setDesativando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Funcionarios</h1>
        <button
          onClick={() => { fecharEdicao(); setMostrarForm((v) => !v); setErro(""); setSucesso("") }}
          className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800"
        >
          {mostrarForm ? "Cancelar" : "+ Novo Funcionario"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4">{sucesso}</div>
      )}

      {mostrarForm && (
        <form onSubmit={salvar} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4">
          {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erro}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
              <input required value={form.nome_completo} onChange={(e) => atualizarCampo("nome_completo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
              <input required value={form.cpf} onChange={(e) => atualizarCampo("cpf", e.target.value)}
                placeholder="000.000.000-00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <input required value={form.cargo} onChange={(e) => atualizarCampo("cargo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (opcional)</label>
              <input value={form.telefone} onChange={(e) => atualizarCampo("telefone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input required type="email" value={form.email} onChange={(e) => atualizarCampo("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Login</label>
              <input required value={form.login} onChange={(e) => atualizarCampo("login", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Senha provisoria</label>
              <input required value={form.senha_provisoria} onChange={(e) => atualizarCampo("senha_provisoria", e.target.value)}
                placeholder="Min. 8 caracteres, 1 maiuscula, 1 numero"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Funcao</label>
              <select value={form.role} onChange={(e) => atualizarCampo("role", e.target.value as FormState["role"])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="funcionario">Funcionario</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
          </div>
          <button disabled={salvando} type="submit"
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      {editandoId && editForm && (
        <form onSubmit={salvarEdicao} className="bg-white rounded-lg shadow p-5 mb-6 space-y-4 border-2 border-green-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Editar funcionario</h2>
            <button type="button" onClick={fecharEdicao} className="text-xs text-gray-500 hover:underline">Fechar</button>
          </div>
          {erroEdicao && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{erroEdicao}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Foto</label>
            <FotoUpload url={editForm.foto_url} endpoint={`/api/uploads/funcionarios/${editandoId}/foto`} onUploaded={fotoAtualizada} redondo />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
              <input required value={editForm.nome_completo} onChange={(e) => atualizarCampoEdicao("nome_completo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
              <input required value={editForm.cargo} onChange={(e) => atualizarCampoEdicao("cargo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone (opcional)</label>
              <input value={editForm.telefone} onChange={(e) => atualizarCampoEdicao("telefone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input required type="email" value={editForm.email} onChange={(e) => atualizarCampoEdicao("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Funcao</label>
              <select value={editForm.role} onChange={(e) => atualizarCampoEdicao("role", e.target.value as EditState["role"])}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="funcionario">Funcionario</option>
                <option value="gestor">Gestor</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t">
            <button disabled={salvandoEdicao} type="submit"
              className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
              {salvandoEdicao ? "Salvando..." : "Salvar alteracoes"}
            </button>
            <button type="button" disabled={desativando} onClick={desativarFuncionario}
              className="bg-red-50 text-red-700 border border-red-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100 disabled:opacity-50">
              {desativando ? "Desativando..." : "Desativar funcionario"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr><th className="p-3">Nome</th><th className="p-3">Login</th><th className="p-3">Cargo</th><th className="p-3">Funcao</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id} onClick={() => abrirEdicao(f)} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="p-3 font-medium flex items-center gap-2">
                  {f.foto_url ? (
                    <img src={f.foto_url} alt={f.nome_completo} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 text-[10px] flex items-center justify-center">
                      {f.nome_completo.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {f.nome_completo}
                </td>
                <td className="p-3">{f.login}</td>
                <td className="p-3">{f.cargo}</td>
                <td className="p-3">{f.role}</td>
                <td className="p-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); abrirEdicao(f) }}
                    className="flex items-center gap-1 text-xs text-blue-700 border border-blue-300 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">
                    <Pencil size={12} /> Editar
                  </button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum funcionario cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
