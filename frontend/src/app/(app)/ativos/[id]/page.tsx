"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { X, Video, Upload, ChevronDown, ChevronUp, Camera, StopCircle, Trash2 } from "lucide-react"
import { getRole } from "@/lib/auth"

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NA_MAO_FUNCIONARIO: { label: "Com Funcionário", color: "bg-blue-100 text-blue-800" },
  NO_DEPOSITO: { label: "No Depósito", color: "bg-green-100 text-green-800" },
  EM_MANUTENCAO: { label: "Em Manutenção", color: "bg-orange-100 text-orange-800" },
  INATIVO: { label: "Inativo", color: "bg-gray-100 text-gray-600" },
}

const CATEGORIA_LABEL: Record<string, { label: string; tipoCategoria: string }> = {
  EQUIPAMENTO: { label: "Equipamento", tipoCategoria: "equipamento" },
  FERRAMENTA: { label: "Ferramenta", tipoCategoria: "ferramenta" },
  ACESSORIO: { label: "Acessório", tipoCategoria: "acessorio" },
}

interface Ativo {
  id: string
  codigo_interno: string
  categoria: string
  tipo_id: string
  modelo: string
  marca: string
  numero_serie: string | null
  ano_fabricacao: number | null
  valor: string | null
  status: string
  responsavel_id: string | null
  observacoes: string | null
  ativo: boolean
  data_revisao_prevista: string | null
  aposentado_em: string | null
  motivo_aposentadoria: string | null
  created_at: string
}

interface Foto {
  id: string
  url: string
  descricao: string | null
}

interface ManutencaoRegistro {
  id: string
  ativo_id: string
  data_hora: string
  video_url: string | null
  descricao: string | null
  proxima_revisao: string | null
  usuario: { id: string; nome_completo: string; cargo: string }
}

export default function FichaAtivoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ativo, setAtivo] = useState<Ativo | null>(null)
  const [tipoNome, setTipoNome] = useState("")
  const [responsavelNome, setResponsavelNome] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState("")
  const inputFotoRef = useRef<HTMLInputElement>(null)

  // Manutenção
  const [registros, setRegistros] = useState<ManutencaoRegistro[]>([])
  const [formAberto, setFormAberto] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [descricao, setDescricao] = useState("")
  const [proximaRevisao, setProximaRevisao] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [progressoUpload, setProgressoUpload] = useState(0)
  const [erroEnvio, setErroEnvio] = useState("")
  const [videoExpandido, setVideoExpandido] = useState<string | null>(null)
  const inputVideoRef = useRef<HTMLInputElement>(null)
  const isGestor = getRole() === "gestor"
  // Gravador embutido
  const [modoGravacao, setModoGravacao] = useState<"idle" | "preparando" | "gravando" | "preview">("idle")
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [tempoGravacao, setTempoGravacao] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoLiveRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function carregarFotos() {
    api.get(`/api/uploads/ativos/${params.id}/fotos`).then((res) => setFotos(res.data)).catch(() => {})
  }

  function carregarRegistros() {
    api.get(`/api/ativos/${params.id}/manutencao-registros`)
      .then((res) => setRegistros(res.data))
      .catch(() => {})
  }

  async function iniciarGravacao() {
    setErroEnvio("")
    setModoGravacao("preparando")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      streamRef.current = stream
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream
        videoLiveRef.current.play()
      }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4"
      const mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 800_000 })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext = mimeType.includes("mp4") ? "mp4" : "webm"
        const file = new File([blob], `manutencao_${Date.now()}.${ext}`, { type: mimeType })
        setVideoFile(file)
        const url = URL.createObjectURL(blob)
        setVideoPreviewUrl(url)
        setModoGravacao("preview")
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (timerRef.current) clearInterval(timerRef.current)
      }
      mediaRecorderRef.current = mr
      mr.start(1000)
      setTempoGravacao(0)
      timerRef.current = setInterval(() => setTempoGravacao((t) => t + 1), 1000)
      setModoGravacao("gravando")
    } catch {
      setModoGravacao("idle")
      setErroEnvio("Não foi possível acessar a câmera. Use 'Selecionar arquivo' para escolher um vídeo da galeria.")
    }
  }

  function pararGravacao() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  function descartarGravacao() {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null) }
    setVideoFile(null)
    setTempoGravacao(0)
    setModoGravacao("idle")
  }

  function formatarTempo(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  }

  async function excluirRegistro(registroId: string) {
    if (!window.confirm("Excluir este registro de manutenção? Esta ação não pode ser desfeita.")) return
    try {
      await api.delete(`/api/ativos/${params.id}/manutencao-registros/${registroId}`)
      setRegistros((rs) => rs.filter((r) => r.id !== registroId))
    } catch {
      alert("Erro ao excluir registro.")
    }
  }

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErroFoto("")
    setEnviandoFoto(true)
    try {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      await api.post(`/api/uploads/ativos/${params.id}/foto`, formData)
      carregarFotos()
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

  async function enviarManutencao() {
    if (!videoFile && !descricao.trim()) {
      setErroEnvio("Informe pelo menos uma descrição ou selecione um vídeo.")
      return
    }
    setEnviando(true)
    setErroEnvio("")
    setProgressoUpload(0)
    try {
      let videoUrl: string | null = null
      let videoPublicId: string | null = null

      if (videoFile) {
        // 1. Obter assinatura do backend
        const { data: signData } = await api.post(`/api/ativos/${params.id}/manutencao-registros/assinar-upload`)

        // 2. Upload direto para o Cloudinary com XMLHttpRequest para acompanhar progresso
        const formData = new FormData()
        formData.append("file", videoFile)
        formData.append("api_key", signData.api_key)
        formData.append("timestamp", String(signData.timestamp))
        formData.append("signature", signData.signature)
        formData.append("folder", signData.folder)

        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setProgressoUpload(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText))
            else reject(new Error("Falha no upload"))
          }
          xhr.onerror = () => reject(new Error("Erro de rede"))
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${signData.cloud_name}/video/upload`)
          xhr.send(formData)
        })

        videoUrl = uploadResult.secure_url
        videoPublicId = uploadResult.public_id
      }

      // 3. Salvar registro no backend
      await api.post(`/api/ativos/${params.id}/manutencao-registros`, {
        video_url: videoUrl,
        video_public_id: videoPublicId,
        descricao: descricao.trim() || null,
        proxima_revisao: proximaRevisao || null,
      })

      // Reset form
      setVideoFile(null)
      setDescricao("")
      setProximaRevisao("")
      setFormAberto(false)
      setProgressoUpload(0)
      setModoGravacao("idle")
      if (videoPreviewUrl) { URL.revokeObjectURL(videoPreviewUrl); setVideoPreviewUrl(null) }
      if (inputVideoRef.current) inputVideoRef.current.value = ""
      carregarRegistros()

      // Recarregar ativo para atualizar data de revisão
      const res = await api.get(`/api/ativos/${params.id}`)
      setAtivo(res.data)
    } catch (err: any) {
      setErroEnvio("Erro ao registrar manutenção. Tente novamente.")
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    carregarFotos()
    carregarRegistros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    api
      .get(`/api/ativos/${params.id}`)
      .then(async (res) => {
        const a: Ativo = res.data
        setAtivo(a)

        const tipoCategoria = CATEGORIA_LABEL[a.categoria]?.tipoCategoria || "equipamento"
        api
          .get(`/api/tipos/${tipoCategoria}`)
          .then((r) => {
            const t = r.data.find((x: any) => x.id === a.tipo_id)
            if (t) setTipoNome(t.nome)
          })
          .catch(() => {})

        if (a.responsavel_id) {
          api
            .get("/api/funcionarios")
            .then((r) => {
              const f = r.data.find((x: any) => x.id === a.responsavel_id)
              if (f) setResponsavelNome(f.nome_completo)
            })
            .catch(() => {})
        }
      })
      .catch((err) => {
        setErro(err?.response?.status === 404 ? "Ativo não encontrado." : "Erro ao carregar ativo.")
      })
      .finally(() => setCarregando(false))
  }, [params.id])

  if (carregando) {
    return <div className="text-sm text-gray-500">Carregando...</div>
  }

  if (erro || !ativo) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
        {erro || "Ativo não encontrado."}
        <div className="mt-3">
          <button onClick={() => router.push("/ativos")} className="text-sm text-red-800 underline">
            Voltar para a lista de ativos
          </button>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[ativo.status] || { label: ativo.status, color: "bg-gray-100 text-gray-600" }
  const categoriaInfo = CATEGORIA_LABEL[ativo.categoria]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{ativo.codigo_interno}</h1>
          <p className="text-sm text-gray-500">{categoriaInfo?.label || ativo.categoria}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      {!ativo.ativo && (
        <div className="bg-gray-100 border border-gray-300 text-gray-600 text-sm rounded-lg p-3 mb-4">
          {ativo.aposentado_em
            ? `Este ativo foi aposentado em ${new Date(ativo.aposentado_em).toLocaleDateString("pt-BR")}.${ativo.motivo_aposentadoria ? ` Motivo: ${ativo.motivo_aposentadoria}` : ""}`
            : "Este ativo está desativado."}
        </div>
      )}

      {/* Fotos */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Fotos</h2>
          <div>
            <input ref={inputFotoRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={enviarFoto} className="hidden" />
            <button type="button" disabled={enviandoFoto} onClick={() => inputFotoRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
              {enviandoFoto ? "Enviando..." : "+ Adicionar foto"}
            </button>
          </div>
        </div>
        {erroFoto && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 mb-3">{erroFoto}</div>}
        {fotos.length === 0 ? (
          <p className="text-xs text-gray-400">Nenhuma foto cadastrada ainda.</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {fotos.map((f) => (
              <div key={f.id} className="relative group">
                <img src={f.url} alt={f.descricao || "Foto do ativo"} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                <button onClick={() => removerFoto(f.id)} title="Remover foto"
                  className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-full p-1 shadow opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Manutenção */}
      <div className="bg-white rounded-lg shadow p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Video size={15} className="text-orange-500" /> Histórico de Manutenção
          </h2>
          <button
            onClick={() => { setFormAberto(!formAberto); setErroEnvio(""); if (formAberto) descartarGravacao() }}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {formAberto ? "Cancelar" : "+ Registrar manutenção"}
          </button>
        </div>

        {/* Formulário de novo registro */}
        {formAberto && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-orange-800 mb-3">Novo Registro de Manutenção</p>

            {/* Vídeo */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Vídeo da manutenção <span className="text-gray-400">(opcional)</span>
              </label>

              {modoGravacao === "idle" && !videoFile && (
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={iniciarGravacao}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600">
                    <Camera size={13} /> Gravar vídeo
                  </button>
                  <button type="button" onClick={() => inputVideoRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-orange-300 bg-white hover:bg-orange-50">
                    <Upload size={13} /> Selecionar da galeria
                  </button>
                  <input ref={inputVideoRef} type="file" accept="video/*" className="hidden"
                    onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null) }} />
                </div>
              )}

              {modoGravacao === "preparando" && (
                <p className="text-xs text-orange-600 animate-pulse">Acessando câmera...</p>
              )}

              {modoGravacao === "gravando" && (
                <div>
                  <video ref={videoLiveRef} autoPlay muted playsInline
                    className="w-full max-h-52 rounded-lg bg-black mb-2 object-cover" />
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                      {formatarTempo(tempoGravacao)}
                    </span>
                    <button type="button" onClick={pararGravacao}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
                      <StopCircle size={13} /> Parar
                    </button>
                  </div>
                </div>
              )}

              {modoGravacao === "preview" && videoPreviewUrl && (
                <div>
                  <video src={videoPreviewUrl} controls
                    className="w-full max-h-52 rounded-lg bg-black mb-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {videoFile && `${(videoFile.size / 1024 / 1024).toFixed(1)} MB · ${formatarTempo(tempoGravacao)}`}
                    </span>
                    <button type="button" onClick={descartarGravacao}
                      className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <Trash2 size={12} /> Regravar
                    </button>
                  </div>
                </div>
              )}

              {modoGravacao === "idle" && videoFile && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <Video size={13} className="text-orange-500 shrink-0" />
                  <span className="truncate">{videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button type="button" onClick={() => setVideoFile(null)} className="text-red-500 shrink-0">
                    <X size={13} />
                  </button>
                </div>
              )}

              {enviando && progressoUpload > 0 && progressoUpload < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${progressoUpload}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Enviando vídeo: {progressoUpload}%</p>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                O que foi feito? <span className="text-gray-400">(peças trocadas, serviços realizados…)</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                placeholder="Ex: Troca de correntes, roletes, limpeza geral. Verificado tensão e alinhamento."
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
              />
            </div>

            {/* Próxima revisão */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Próxima revisão prevista <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="date"
                value={proximaRevisao}
                onChange={(e) => setProximaRevisao(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {erroEnvio && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-2 mb-3">{erroEnvio}</div>
            )}

            <button
              onClick={enviarManutencao}
              disabled={enviando}
              className="w-full bg-orange-500 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {enviando ? (progressoUpload > 0 ? `Enviando vídeo (${progressoUpload}%)...` : "Salvando...") : "Registrar manutenção"}
            </button>
          </div>
        )}

        {/* Lista de registros */}
        {registros.length === 0 ? (
          <p className="text-xs text-gray-400">Nenhuma manutenção registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {registros.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-start justify-between p-3 bg-gray-50">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {new Date(r.data_hora).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-gray-500">{r.usuario.nome_completo} · {r.usuario.cargo}</p>
                    {r.proxima_revisao && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        Próxima revisão: {new Date(r.proxima_revisao + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.video_url && (
                      <button
                        onClick={() => setVideoExpandido(videoExpandido === r.id ? null : r.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
                      >
                        <Video size={13} />
                        {videoExpandido === r.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                    {isGestor && (
                      <button
                        onClick={() => excluirRegistro(r.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Excluir registro"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {r.descricao && (
                  <div className="px-3 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.descricao}</p>
                  </div>
                )}

                {r.video_url && videoExpandido === r.id && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <video
                      controls
                      className="w-full max-h-64 rounded mt-2 bg-black"
                      src={r.video_url}
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dados do ativo */}
      <div className="bg-white rounded-lg shadow p-5">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Tipo</dt>
            <dd className="font-medium text-gray-800">{tipoNome || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Modelo</dt>
            <dd className="font-medium text-gray-800">{ativo.modelo}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Marca</dt>
            <dd className="font-medium text-gray-800">{ativo.marca}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Número de série</dt>
            <dd className="font-medium text-gray-800">{ativo.numero_serie || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Ano de fabricação</dt>
            <dd className="font-medium text-gray-800">{ativo.ano_fabricacao || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Valor</dt>
            <dd className="font-medium text-gray-800">{ativo.valor ? `R$ ${ativo.valor}` : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Responsável atual</dt>
            <dd className="font-medium text-gray-800">{responsavelNome || "No depósito"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Cadastrado em</dt>
            <dd className="font-medium text-gray-800">{new Date(ativo.created_at).toLocaleDateString("pt-BR")}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Próxima revisão prevista</dt>
            <dd className="font-medium text-gray-800">{ativo.data_revisao_prevista ? new Date(ativo.data_revisao_prevista + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</dd>
          </div>
          {ativo.observacoes && (
            <div className="md:col-span-2">
              <dt className="text-xs text-gray-500">Observações</dt>
              <dd className="font-medium text-gray-800">{ativo.observacoes}</dd>
            </div>
          )}
        </dl>
      </div>

      <button onClick={() => router.push("/ativos")} className="mt-4 text-sm text-green-700 hover:underline">
        ← Voltar para a lista de ativos
      </button>
    </div>
  )
}
