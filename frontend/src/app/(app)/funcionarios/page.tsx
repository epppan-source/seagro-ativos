"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"

interface Funcionario {
  id: string
  nome_completo: string
  login: string
  email: string
  cargo: string
  role: string
  ativo: boolean
}

interface FormState {
  nome_completo: string
  cpf: string
  cargo: string
  telefone: string
  email: string
  login: string
  role: "funcionario" | "gestor"
}

const FORM_INICIAL: FormState = {
  nome_completo: "",
  cpf: "",
  cargo: "",
  telefone: "",
  email: "",
  login: "",
  role: "funcionario",
}

export default function FuncionariosPage() {
  const [lista, setLista] = useState<Funcionario[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

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
      setSucesso("Funcionario cadastrado. E-mail com login e senha temporaria enviado para " + form.email + ".")
      setForm(FORM_INICIAL)
      setMostrarForm(false)
      carregar()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao cadastrar funcionario.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Funcionarios</h1>
        <button
          onClick={() => { setMostrarForm((v) => !v); setErro(""); setSucesso("") }}
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr><th className="p-3">Nome</th><th className="p-3">Login</th><th className="p-3">Cargo</th><th className="p-3">Funcao</th></tr>
          </thead>
          <tbody>
            {lista.map((f) => (
              <tr key={f.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{f.nome_completo}</td>
                <td className="p-3">{f.login}</td>
                <td className="p-3">{f.cargo}</td>
                <td className="p-3">{f.role}</td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nenhum funcionario cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
