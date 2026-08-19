"use client"
import { X } from "lucide-react"

export default function SidePanel({
  aberto,
  onFechar,
  titulo,
  children,
}: {
  aberto: boolean
  onFechar: () => void
  titulo: string
  children: React.ReactNode
}) {
  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full sm:w-[440px] max-w-full bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h3 className="text-sm font-semibold text-gray-800">{titulo}</h3>
          <button
            type="button"
            onClick={onFechar}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
