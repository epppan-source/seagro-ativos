"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"

export default function ResolverCodigoPage() {
  const params = useParams<{ codigo: string }>()
  const router = useRouter()
  const [status, setStatus] = useState<"buscando" | "nao_encontrado" | "erro">("buscando")

  useEffect(() => {
    api
      .get(`/api/ativos/codigo/${params.codigo}`)
      .then((res) => {
        router.replace(`/ativos/${res.data.id}`)
      })
      .catch((err) => {
        setStatus(err?.response?.status === 404 ? "nao_encontrado" : "erro")
      })
  }, [params.codigo])

  if (status === "buscando") {
    return <div className="text-sm text-gray-500">Buscando ativo com código {params.codigo}...</div>
  }

  if (status === "nao_encontrado") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-4 max-w-md">
        <p className="font-medium mb-1">Código {params.codigo} ainda não está vinculado a nenhum ativo.</p>
        <p>Esta etiqueta está no estoque, aguardando ser colada em um equipamento e cadastrada no sistema.</p>
        <button onClick={() => router.push("/ativos")} className="mt-3 text-sm text-yellow-900 underline">
          Ir para a lista de ativos
        </button>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4 max-w-md">
      Erro ao buscar este código. Tente de novo em alguns instantes.
    </div>
  )
}
