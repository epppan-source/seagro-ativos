from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ativo import Ativo, StatusAtivo
from app.models.transferencia import Transferencia, StatusTransferencia
from app.models.manutencao import Manutencao, StatusManutencao
from app.models.material import Material


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
