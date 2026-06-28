from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ativo import Ativo, StatusAtivo
from app.models.transferencia import Transferencia, StatusTransferencia
from app.models.manutencao import Manutencao, StatusManutencao
from app.models.material import Material
from app.models.peca_reposicao import PecaReposicao
from app.models.funcionario import Funcionario


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def resumo(self):
        total_ativos = (await self.db.execute(select(func.count(Ativo.id)).where(Ativo.ativo == True))).scalar()

        por_status = {}
        result = await self.db.execute(
            select(Ativo.status, func.count(Ativo.id)).where(Ativo.ativo == True).group_by(Ativo.status)
        )
        for status_, qtd in result.all():
            por_status[status_.value] = qtd

        transferencias_pendentes = (await self.db.execute(
            select(func.count(Transferencia.id)).where(Transferencia.status == StatusTransferencia.PENDENTE)
        )).scalar()

        manutencoes_agendadas = (await self.db.execute(
            select(func.count(Manutencao.id)).where(Manutencao.status == StatusManutencao.AGENDADA)
        )).scalar()

        materiais_baixo_estoque = (await self.db.execute(
            select(func.count(Material.id)).where(Material.quantidade_atual <= Material.quantidade_minima, Material.ativo == True)
        )).scalar()

        return {
            "total_ativos": total_ativos or 0,
            "ativos_por_status": por_status,
            "transferencias_pendentes": transferencias_pendentes or 0,
            "manutencoes_agendadas": manutencoes_agendadas or 0,
            "materiais_baixo_estoque": materiais_baixo_estoque or 0,
        }

    @staticmethod
    def _serializar_ativo(a: Ativo) -> dict:
        return {
            "id": str(a.id),
            "codigo_interno": a.codigo_interno,
            "categoria": a.categoria.value,
            "modelo": a.modelo,
            "marca": a.marca,
            "status": a.status.value,
        }

    @staticmethod
    def _serializar_material(m: Material) -> dict:
        return {
            "id": str(m.id),
            "codigo": m.codigo,
            "nome": m.nome,
            "quantidade_atual": float(m.quantidade_atual),
            "quantidade_minima": float(m.quantidade_minima),
            "unidade": m.unidade,
            "baixo_estoque": m.quantidade_atual <= m.quantidade_minima,
        }

    @staticmethod
    def _serializar_peca(p: PecaReposicao) -> dict:
        return {
            "id": str(p.id),
            "codigo": p.codigo,
            "nome": p.nome,
            "quantidade_atual": float(p.quantidade_atual),
            "quantidade_minima": float(p.quantidade_minima),
            "unidade": p.unidade,
            "baixo_estoque": p.quantidade_atual <= p.quantidade_minima,
        }

    async def painel(self, usuario_logado_id=None):
        """Visão do Dashboard agrupada por 'onde o ativo está': Depósito, cada
        Funcionário (com seus ativos + materiais + peças de reposição na mão),
        Manutenção e Materiais/Peças em estoque no depósito (sem responsável).
        Decisão Pancini 2026-06-26 (Proposta A) — ver memória
        projeto_dashboard_cards_por_responsavel.md.
        O proprietário (usuário logado) não recebe card de funcionário —
        decisão Pancini 2026-06-27.
        """
        deposito_ativos = (await self.db.execute(
            select(Ativo).where(Ativo.ativo == True, Ativo.status == StatusAtivo.NO_DEPOSITO)
            .order_by(Ativo.modelo, Ativo.codigo_interno)
        )).scalars().all()

        manutencao_ativos = (await self.db.execute(
            select(Ativo).where(Ativo.ativo == True, Ativo.status == StatusAtivo.EM_MANUTENCAO)
            .order_by(Ativo.modelo, Ativo.codigo_interno)
        )).scalars().all()

        manutencoes_agendadas = (await self.db.execute(
            select(func.count(Manutencao.id)).where(Manutencao.status == StatusManutencao.AGENDADA)
        )).scalar() or 0

        materiais_estoque = (await self.db.execute(
            select(Material).where(Material.ativo == True, Material.responsavel_id.is_(None)).order_by(Material.nome)
        )).scalars().all()

        pecas_estoque = (await self.db.execute(
            select(PecaReposicao).where(PecaReposicao.ativo == True, PecaReposicao.responsavel_id.is_(None)).order_by(PecaReposicao.nome)
        )).scalars().all()

        funcionarios_query = select(Funcionario).where(Funcionario.ativo == True)
        if usuario_logado_id is not None:
            funcionarios_query = funcionarios_query.where(Funcionario.id != usuario_logado_id)
        funcionarios = (await self.db.execute(
            funcionarios_query.order_by(Funcionario.nome_completo)
        )).scalars().all()

        ativos_func = (await self.db.execute(
            select(Ativo).where(Ativo.ativo == True, Ativo.responsavel_id.isnot(None))
            .order_by(Ativo.modelo, Ativo.codigo_interno)
        )).scalars().all()
        ativos_por_func: dict = {}
        for a in ativos_func:
            ativos_por_func.setdefault(a.responsavel_id, []).append(a)

        materiais_func = (await self.db.execute(
            select(Material).where(Material.ativo == True, Material.responsavel_id.isnot(None))
        )).scalars().all()
        materiais_por_func: dict = {}
        for m in materiais_func:
            materiais_por_func.setdefault(m.responsavel_id, []).append(m)

        pecas_func = (await self.db.execute(
            select(PecaReposicao).where(PecaReposicao.ativo == True, PecaReposicao.responsavel_id.isnot(None))
        )).scalars().all()
        pecas_por_func: dict = {}
        for p in pecas_func:
            pecas_por_func.setdefault(p.responsavel_id, []).append(p)

        funcionarios_payload = []
        for f in funcionarios:
            ativos_f = ativos_por_func.get(f.id, [])
            materiais_f = materiais_por_func.get(f.id, [])
            pecas_f = pecas_por_func.get(f.id, [])
            funcionarios_payload.append({
                "funcionario": {"id": str(f.id), "nome_completo": f.nome_completo, "cargo": f.cargo},
                "total_itens": len(ativos_f) + len(materiais_f) + len(pecas_f),
                "ativos": [self._serializar_ativo(a) for a in ativos_f],
                "materiais": [self._serializar_material(m) for m in materiais_f],
                "pecas": [self._serializar_peca(p) for p in pecas_f],
            })

        materiais_estoque_out = [self._serializar_material(m) for m in materiais_estoque]
        pecas_estoque_out = [self._serializar_peca(p) for p in pecas_estoque]
        baixo_estoque = [i for i in materiais_estoque_out if i["baixo_estoque"]] + \
                         [i for i in pecas_estoque_out if i["baixo_estoque"]]

        return {
            "deposito": {
                "total": len(deposito_ativos),
                "ativos": [self._serializar_ativo(a) for a in deposito_ativos],
            },
            "funcionarios": funcionarios_payload,
            "manutencao": {
                "total": len(manutencao_ativos),
                "ativos": [self._serializar_ativo(a) for a in manutencao_ativos],
                "manutencoes_agendadas": manutencoes_agendadas,
            },
            "materiais": {
                "total_estoque": len(materiais_estoque_out) + len(pecas_estoque_out),
                "total_baixo_estoque": len(baixo_estoque),
                "baixo_estoque": baixo_estoque,
                "materiais": materiais_estoque_out,
                "pecas": pecas_estoque_out,
            },
        }
