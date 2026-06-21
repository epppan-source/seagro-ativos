"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"

interface Material {
  id: string
  nome: string
  codigo: string
  quantidade_atual: number
  quantidade_minima: number
  unidade: string
}

interface Tipo {
  id: string
  nome: string
}

interface FormState {
  nome: string
  codigo: string
  tipo_material_id: string
  descricao: string
  unidade: string
  quantidade_minima: string
  quantidade_atual: string
}

const FORM_INICIAL: FormState = {
  nome: "",
  codigo: "",
  tipo_material_id: "",
  descricao: "",
  unidade: "un",
  quantidade_minima: "0",
  quantidade_atual: "0",
}

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const [mostrarNovoTipo, setMostrarNovoTipo] = useState(false)
  const [novoTipoNome, setNovoTipoNome] = useState("")
  const [salvandoTipo, setSalvandoTipo] = useState(false)

  function carregarMateriais() {
    api.get("/api/materiais").then((res) => setMateriais(res.data)).catch(() => {})
  }

  function carregarTipos() {
    api.get("/api/tipos/material").then((res) => setTipos(res.data)).catch(() => {})
  }

  useEffect(() => {
    carregarMateriais()
    carregarTipos()
  }, [])

  function atualizarCampo(campo: keyof FormState, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Materiais</h1>
        <button
          onClick={() => { setMostrarForm((v) => !v); setErro(""); setSucesso("") }}
          className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800"
        >
          {mostrarForm ? "Cancelar" : "+ Novo Material"}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
              <input required value={form.nome} onChange={(e) => atualizarCampo("nome", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Codigo</label>
              <input required value={form.codigo} onChange={(e) => atualizarCampo("codigo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unidade</label>
              <input value={form.unidade} onChange={(e) => atualizarCampo("unidade", e.target.value)}
                placeholder="un, m, kg, rolo..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade atual</label>
              <input required type="number" step="0.01" value={form.quantidade_atual} onChange={(e) => atualizarCampo("quantidade_atual", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade minima</label>
              <input required type="number" step="0.01" value={form.quantidade_minima} onChange={(e) => atualizarCampo("quantidade_minima", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descricao (opcional)</label>
              <input value={form.descricao} onChange={(e) => atualizarCampo("descricao", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button disabled={salvando} type="submit"
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {materiais.map((m) => {
          const pct = Math.min((m.quantidade_atual / (m.quantidade_minima * 2 || 1)) * 100, 100)
          const color = m.quantidade_atual === 0 ? "bg-red-500" : m.quantidade_atual <= m.quantidade_minima ? "bg-orange-400" : "bg-green-500"
          return (
            <div key={m.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{m.nome} <span className="text-gray-400 text-xs">({m.codigo})</span></span>
                <span className="text-xs text-gray-500">{m.quantidade_atual} / {m.quantidade_minima} {m.unidade}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        {materiais.length === 0 && <p className="text-gray-400">Nenhum material cadastrado ainda.</p>}
      </div>
    </div>
  )
}
