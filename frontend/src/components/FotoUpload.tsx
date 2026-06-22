"use client"
import { useRef, useState } from "react"
import api from "@/lib/api"

interface FotoUploadProps {
  url?: string | null
  endpoint: string
  onUploaded: (url: string) => void
  tamanho?: number
  alt?: string
  redondo?: boolean
}

export default function FotoUpload({ url, endpoint, onUploaded, tamanho = 80, alt = "Foto", redondo = false }: FotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  async function selecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro("")
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      const res = await api.post(endpoint, formData)
      onUploaded(res.data.url)
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao enviar foto.")
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        style={{ width: tamanho, height: tamanho }}
        className={`bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0 ${redondo ? "rounded-full" : "rounded-lg"}`}
      >
        {url ? (
          <img src={url} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-300 text-[10px] text-center px-1">Sem foto</span>
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={selecionarArquivo} className="hidden" />
        <button type="button" disabled={enviando} onClick={() => inputRef.current?.click()}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
          {enviando ? "Enviando..." : url ? "Trocar foto" : "Adicionar foto"}
        </button>
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
      </div>
    </div>
  )
}
