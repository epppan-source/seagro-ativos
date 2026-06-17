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

export default function FuncionariosPage() {
  const [lista, setLista] = useState<Funcionario[]>([])

  useEffect(() => {
    api.get("/api/funcionarios").then((res) => setLista(res.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Funcionários</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left text-gray-600">
            <tr><th className="p-3">Nome</th><th className="p-3">Login</th><th className="p-3">Cargo</th><th className="p-3">Função</th></tr>
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
            {lista.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nenhum funcionário cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
