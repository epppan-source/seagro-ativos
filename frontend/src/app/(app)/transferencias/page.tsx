"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { QrCode, Search, Camera, CheckCircle, XCircle } from "lucide-react"

interface Transferencia {
  id: string
  ativo_id: string
  solicitante_id: string
  novo_responsavel_id: string
  status: string
  motivo_solicitacao: string | null
  solicitado_em: string
}

interface Ativo {
  id: string
  codigo_interno: string
  modelo: string
  marca: string
  responsavel_id: string | null
}

interface Funcionario {
  id: string
  nome_completo: string
}

const STATUS_STYLE: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  APROVADA: "bg-green-100 text-green-800",
  REJEITADA: "bg-red-100 text-red-800",
}

export default function TransferenciasPage() {
  const [lista, setLista] = useState<Transferencia[]>([])
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [modo, setModo] = useState<"qr" | "dropdown">("qr")

  const [ativoId, setAtivoId] = useState("")
  const [ativoDetectado, setAtivoDetectado] = useState<Ativo | null>(null)
  const [novoResponsavelId, setNovoResponsavelId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  // Scanner refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animRef = useRef<number | null>(null)
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found" | "error">("idle")
  const [scanMsg, setScanMsg] = useState("")

  function carregarLista() {
    api.get("/api/transferencias").then((r) => setLista(r.data)).catch(() => {})
  }
  function carregarAtivos() {
    api.get("/api/ativos").then((r) => setAtivos(r.data)).catch(() => {})
  }
  function carregarFuncionarios() {
    api.get("/api/funcionarios").then((r) => setFuncionarios(r.data)).catch(() => {})
  }

  useEffect(() => {
    setRole(getRole())
    api.get("/api/auth/me").then((r) => setMeuId(r.data.id)).catch(() => {})
    carregarLista()
    carregarAtivos()
    carregarFuncionarios()
  }, [])

  // Para a camera ao desmontar
  useEffect(() => {
    return () => { pararCamera() }
  }, [])

  function pararCamera() {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setScanStatus("idle")
  }

  const iniciarScanner = useCallback(async () => {
    setScanStatus("scanning")
    setScanMsg("Iniciando camera...")
    setAtivoId("")
    setAtivoDetectado(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanMsg("Aponte para o QR Code do equipamento")
      loopScan()
    } catch {
      setScanStatus("error")
      setScanMsg("Camera nao disponivel. Use o modo de busca.")
    }
  }, [ativos])

  const loopScan = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !streamRef.current) return

    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        import("jsqr").then(({ default: jsQR }) => {
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })
          if (code?.data) {
            // Extrai UUID da URL: .../ativos/{uuid}
            const match = code.data.match(/\/ativos\/([0-9a-f-]{36})/i)
            if (match) {
              const uuid = match[1]
              const encontrado = ativos.find((a) => a.id === uuid)
              if (encontrado) {
                pararCamera()
                setAtivoId(encontrado.id)
                setAtivoDetectado(encontrado)
                setScanStatus("found")
                setScanMsg(`${encontrado.codigo_interno} — ${encontrado.modelo}`)
                return
              } else {
                setScanMsg("QR Code lido, mas ativo nao encontrado no sistema.")
              }
            } else {
              setScanMsg("QR Code invalido. Aponte para a etiqueta do equipamento.")
            }
          }
          animRef.current = requestAnimationFrame(loopScan)
        })
        return
      }
    }
    animRef.current = requestAnimationFrame(loopScan)
  }, [ativos])

  function trocarModo(novo: "qr" | "dropdown") {
    pararCamera()
    setAtivoId("")
    setAtivoDetectado(null)
    setScanStatus("idle")
    setScanMsg("")
    setModo(novo)
  }

  function fecharForm() {
    pararCamera()
    setMostrarForm(false)
    setAtivoId("")
    setAtivoDetectado(null)
    setNovoResponsavelId("")
    setMotivo("")
    setErro("")
    setSucesso("")
    setScanStatus("idle")
    setScanMsg("")
  }

  function nomeAtivo(id: string) {
    const a = ativos.find((x) => x.id === id)
    return a ? `${a.codigo_interno} — ${a.modelo}` : id
  }
  function nomeFuncionario(id: string) {
    return funcionarios.find((f) => f.id === id)?.nome_completo || id
  }

  const ativosDisponiveis =
    role === "gestor" ? ativos : ativos.filter((a) => a.responsavel_id === meuId)

  async function decidir(id: string, aprovar: boolean) {
    await api.post(`/api/transferencias/${id}/decisao`, { aprovar })
    carregarLista()
    carregarAtivos()
  }

  async function solicitar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    if (!ativoId || !novoResponsavelId) {
      setErro("Selecione o ativo e o novo responsavel.")
      return
    }
    setSalvando(true)
    try {
      await api.post("/api/transferencias", {
        ativo_id: ativoId,
        novo_responsavel_id: novoResponsavelId,
        motivo_solicitacao: motivo || null,
      })
      setSucesso("Transferencia solicitada! O gestor sera notificado por e-mail.")
      fecharForm()
      carregarLista()
      carregarAtivos()
    } catch (err: any) {
      setErro(err?.response?.data?.detail || "Erro ao solicitar transferencia.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-800">Transferencias</h1>
        <button
          onClick={() => mostrarForm ? fecharForm() : setMostrarForm(true)}
          className="w-full sm:w-auto bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-green-800 min-h-[44px]"
        >
          {mostrarForm ? "Cancelar" : "+ Solicitar Transferencia"}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" /> {sucesso}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">

          {/* Toggle QR / Dropdown */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => trocarModo("qr")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border-2 min-h-[44px] transition-colors ${
                modo === "qr"
                  ? "border-green-700 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <QrCode size={18} /> Ler QR Code
            </button>
            <button
              type="button"
              onClick={() => trocarModo("dropdown")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium border-2 min-h-[44px] transition-colors ${
                modo === "dropdown"
                  ? "border-green-700 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Search size={18} /> Buscar por nome
            </button>
          </div>

          <form onSubmit={solicitar} className="space-y-4">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2">
                <XCircle size={16} className="shrink-0" /> {erro}
              </div>
            )}

            {/* --- MODO QR --- */}
            {modo === "qr" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Ativo</label>

                {scanStatus !== "found" && (
                  <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-3">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {/* Mira */}
                    {scanStatus === "scanning" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-4 border-white rounded-2xl opacity-70" />
                      </div>
                    )}
                    {/* Estado idle */}
                    {scanStatus === "idle" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <button
                          type="button"
                          onClick={iniciarScanner}
                          className="flex flex-col items-center gap-2 text-white"
                        >
                          <Camera size={40} />
                          <span className="text-sm font-medium">Tocar para ativar camera</span>
                        </button>
                      </div>
                    )}
                    {/* Erro camera */}
                    {scanStatus === "error" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm text-center px-4">
                        {scanMsg}
                      </div>
                    )}
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />

                {/* Mensagem de status */}
                {scanStatus === "scanning" && (
                  <p className="text-xs text-gray-500 text-center mb-2">{scanMsg}</p>
                )}

                {/* Ativo detectado */}
                {scanStatus === "found" && ativoDetectado && (
                  <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <CheckCircle size={20} className="text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800">{ativoDetectado.codigo_interno}</p>
                      <p className="text-xs text-green-600">{ativoDetectado.modelo} {ativoDetectado.marca ? `/ ${ativoDetectado.marca}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={iniciarScanner}
                      className="text-xs text-green-700 underline"
                    >
                      Reler
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- MODO DROPDOWN --- */}
            {modo === "dropdown" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ativo</label>
                <select
                  value={ativoId}
                  onChange={(e) => setAtivoId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm min-h-[44px]"
                >
                  <option value="">Selecione o ativo...</option>
                  {ativosDisponiveis.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo_interno} - {a.modelo}</option>
                  ))}
                </select>
                {ativosDisponiveis.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Nenhum ativo sob sua responsabilidade.</p>
                )}
              </div>
            )}

            {/* Novo responsavel (comum aos dois modos) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Novo responsavel</label>
              <select
                value={novoResponsavelId}
                onChange={(e) => setNovoResponsavelId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm min-h-[44px]"
              >
                <option value="">Selecione o funcionario...</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome_completo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
              <input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: emprestimo para obra X"
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm"
              />
            </div>

            <button
              disabled={salvando || !ativoId || !novoResponsavelId}
              type="submit"
              className="w-full bg-green-700 text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-green-800 disabled:opacity-40 min-h-[44px]"
            >
              {salvando ? "Enviando..." : "Solicitar Transferencia"}
            </button>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {lista.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4">
            <div className="mb-3">
              <p className="font-medium text-gray-800 text-sm">{nomeAtivo(t.ativo_id)}</p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium">{nomeFuncionario(t.solicitante_id)}</span>
                {" → "}
                <span className="font-medium">{nomeFuncionario(t.novo_responsavel_id)}</span>
              </p>
              {t.motivo_solicitacao && (
                <p className="text-xs text-gray-400 mt-1 italic">{t.motivo_solicitacao}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(t.solicitado_em).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium self-start ${STATUS_STYLE[t.status] || "bg-gray-100 text-gray-600"}`}>
                {t.status}
              </span>
              {role === "gestor" && t.status === "PENDENTE" && (
                <>
                  <button onClick={() => decidir(t.id, true)} className="w-full sm:w-auto text-sm bg-green-600 text-white px-4 py-2 rounded-lg min-h-[44px] hover:bg-green-700">
                    Aprovar
                  </button>
                  <button onClick={() => decidir(t.id, false)} className="w-full sm:w-auto text-sm bg-red-600 text-white px-4 py-2 rounded-lg min-h-[44px] hover:bg-red-700">
                    Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">Nenhuma transferencia registrada.</p>
        )}
      </div>
    </div>
  )
}
