"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { getRole } from "@/lib/auth"
import { Printer } from "lucide-react"

interface Funcionario {
  id: string
  nome_completo: string
  cargo: string
  email: string
  cpf: string
}

interface Ativo {
  id: string
  codigo_interno: string
  modelo: string
  marca: string
  numero_serie: string | null
  ano_fabricacao: number | null
  categoria: string
  responsavel_id: string | null
  status: string
}

const CATEGORIA_LABEL: Record<string, string> = {
  EQUIPAMENTO: "Equipamento",
  FERRAMENTA: "Ferramenta",
  ACESSORIO: "Acessório",
  VEICULO: "Veículo",
  OUTRO: "Outro",
}

export default function TermoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null)
  const [ativos, setAtivos] = useState<Ativo[]>([])
  const [dataVigencia, setDataVigencia] = useState(new Date().toISOString().slice(0, 10))
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const role = getRole()
    if (role !== "gestor") { router.push("/dashboard"); return }
    Promise.all([
      api.get("/api/funcionarios").then((r) => r.data),
      api.get("/api/ativos").then((r) => r.data),
    ]).then(([funcs, ats]) => {
      const func = funcs.find((f: Funcionario) => f.id === id)
      if (!func) { router.push("/termos"); return }
      setFuncionario(func)
      setAtivos(ats.filter((a: Ativo) => a.responsavel_id === id))
    }).finally(() => setCarregando(false))
  }, [id])

  function formatarData(iso: string) {
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${y}`
  }

  function formatarCPF(cpf: string) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }

  function dataRevisao(iso: string) {
    const [y, m, d] = iso.split("-")
    return `${d}/${m}/${Number(y) + 1}`
  }

  if (carregando) return <p className="text-gray-400 text-sm p-6">Carregando...</p>
  if (!funcionario) return null

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #termo-conteudo, #termo-conteudo * { visibility: visible !important; }
          #termo-conteudo { position: fixed; top: 0; left: 0; width: 100%; }
          #controles-termo { display: none !important; }
        }
      `}</style>

      {/* Controles (somem na impressão) */}
      <div id="controles-termo" className="mb-6 flex items-end gap-4 print:hidden">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Data de vigência do Termo</label>
          <input
            type="date"
            value={dataVigencia}
            onChange={(e) => setDataVigencia(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-seagro text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-seagro-dark"
        >
          <Printer size={15} /> Imprimir / Salvar PDF
        </button>
        <button
          onClick={() => router.push("/termos")}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar
        </button>
      </div>

      {/* Documento imprimível */}
      <div id="termo-conteudo" className="bg-white max-w-3xl mx-auto p-10 text-sm leading-relaxed text-gray-800 border border-gray-200 rounded-lg shadow-sm">

        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-1">SEAGRO Soluções Ambientais</p>
          <h1 className="text-lg font-bold uppercase tracking-wide">Termo de Responsabilidade de Equipamentos</h1>
          <div className="border-b-2 border-gray-800 mt-3" />
        </div>

        {/* Identificação */}
        <div className="mb-6 grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-semibold">Funcionário:</span> {funcionario.nome_completo}</div>
          <div><span className="font-semibold">CPF:</span> {formatarCPF(funcionario.cpf)}</div>
          <div><span className="font-semibold">Cargo:</span> {funcionario.cargo}</div>
          <div><span className="font-semibold">Data de vigência:</span> {formatarData(dataVigencia)}</div>
        </div>

        {/* Preâmbulo */}
        <p className="mb-6 text-justify">
          Eu, <strong>{funcionario.nome_completo}</strong>, portador(a) do CPF n.º <strong>{formatarCPF(funcionario.cpf)}</strong>,
          ocupando o cargo de <strong>{funcionario.cargo}</strong> na empresa <strong>SEAGRO Soluções Ambientais</strong>,
          declaro ter recebido em plenas condições de uso e conservação os equipamentos, ferramentas e demais
          ativos relacionados abaixo, comprometendo-me a cumprir integralmente as cláusulas deste Termo.
        </p>

        {/* Tabela de ativos */}
        <p className="font-semibold mb-2">Relação de Ativos Atribuídos:</p>
        <table className="w-full border-collapse text-xs mb-8">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-700 px-2 py-1 text-left">Código</th>
              <th className="border border-gray-700 px-2 py-1 text-left">Categoria</th>
              <th className="border border-gray-700 px-2 py-1 text-left">Modelo / Marca</th>
              <th className="border border-gray-700 px-2 py-1 text-left">Nº Série</th>
              <th className="border border-gray-700 px-2 py-1 text-left">Ano</th>
            </tr>
          </thead>
          <tbody>
            {ativos.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-200 px-2 py-1 font-mono">{a.codigo_interno}</td>
                <td className="border border-gray-200 px-2 py-1">{CATEGORIA_LABEL[a.categoria] || a.categoria}</td>
                <td className="border border-gray-200 px-2 py-1">{a.modelo} {a.marca ? `/ ${a.marca}` : ""}</td>
                <td className="border border-gray-200 px-2 py-1">{a.numero_serie || "—"}</td>
                <td className="border border-gray-200 px-2 py-1">{a.ano_fabricacao || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Cláusulas */}
        <p className="font-semibold mb-3">Cláusulas:</p>

        <p className="mb-4 text-justify">
          <strong>1. Responsabilidade pela Guarda e Conservação.</strong> O signatário declara-se responsável pela
          guarda, conservação e uso adequado dos ativos listados acima a partir da data de vigência deste Termo.
          Qualquer avaria, extravio, furto ou roubo deverá ser comunicado imediatamente ao gestor responsável,
          sob pena de ressarcimento pelo valor de mercado do bem, conforme avaliação da empresa.
        </p>

        <p className="mb-4 text-justify">
          <strong>2. Procedimento de Movimentação e Transferência.</strong> Toda e qualquer movimentação,
          transferência ou devolução dos ativos listados neste Termo deverá ser realizada exclusivamente por
          meio do sistema SEAGRO Ativos, obedecendo ao seguinte trâmite: (a) leitura do QR Code do equipamento
          pelo sistema; (b) registro da transferência com identificação do destinatário; e (c) aprovação prévia
          do gestor responsável. Movimentações realizadas fora deste procedimento não serão reconhecidas e a
          responsabilidade pelo ativo permanecerá com o último signatário registrado no sistema.
        </p>

        <p className="mb-8 text-justify">
          <strong>3. Vigência e Revisão Periódica.</strong> Este Termo entra em vigor na data de{" "}
          <strong>{formatarData(dataVigencia)}</strong> e permanecerá válido por 12 (doze) meses, com revisão
          prevista para <strong>{dataRevisao(dataVigencia)}</strong> ou sempre que houver alteração no rol de
          ativos sob responsabilidade do signatário, o que ocorrer primeiro. A revisão implicará a emissão de
          novo Termo atualizando a relação de equipamentos.
        </p>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-12 mt-10">
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2 mt-10">
              <p className="font-semibold">{funcionario.nome_completo}</p>
              <p className="text-xs text-gray-500">CPF: {formatarCPF(funcionario.cpf)}</p>
              <p className="text-xs text-gray-500">Funcionário</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 pt-2 mt-10">
              <p className="font-semibold">Eduardo Pancini</p>
              <p className="text-xs text-gray-500">Gestor Responsável</p>
              <p className="text-xs text-gray-500">SEAGRO Soluções Ambientais</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Bauru/SP, {formatarData(dataVigencia)}
        </p>
      </div>
    </>
  )
}
