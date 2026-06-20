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
      setSucesso(`Funcionário cadastrado. E-mail com login e senha temporária enviado para ${form.email}.`)
    