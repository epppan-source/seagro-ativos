from datetime import date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.manutencao import Manutencao, StatusManutencao
from app.models.material import Material
from app.models.peca_reposicao import PecaReposicao
from app.models.funcionario import Funcionario, RoleFuncionario
from app.services.email_service import EmailService

scheduler = AsyncIOScheduler()
email_service = EmailService()


async def verificar_manutencoes_proximas():
    async with AsyncSessionLocal() as db:
        limite = date.today() + timedelta(days=7)
        result = await db.execute(
            select(Manutencao).where(
                Manutencao.proxima_manutencao <= limite,
                Manutencao.proxima_manutencao >= date.today(),
                Manutencao.status != StatusManutencao.CANCELADA,
            )
        )
        manutencoes = result.scalars().all()
        if not manutencoes:
            return
        gestores = (await db.execute(select(Funcionario).where(Funcionario.role == RoleFuncionario.gestor))).scalars().all()
        for m in manutencoes:
            ativo = await db.get(__import__("app.models.ativo", fromlist=["Ativo"]).Ativo, m.ativo_id)
            for gestor in gestores:
                await email_service.enviar_alerta_manutencao(gestor.email, ativo.codigo_interno, str(m.proxima_manutencao))


async def verificar_estoque_baixo():
    """Varredura diária (cron 07:15): junta Materiais + Peças de Reposição com
    estoque no mínimo ou abaixo e manda UM e-mail consolidado por gestor,
    em vez de um e-mail por item (reduz ruído na caixa de entrada).
    """
    async with AsyncSessionLocal() as db:
        result_materiais = await db.execute(
            select(Material).where(Material.quantidade_atual <= Material.quantidade_minima, Material.ativo == True)
        )
        materiais = result_materiais.scalars().all()

        result_pecas = await db.execute(
            select(PecaReposicao).where(PecaReposicao.quantidade_atual <= PecaReposicao.quantidade_minima, PecaReposicao.ativo == True)
        )
        pecas = result_pecas.scalars().all()

        if not materiais and not pecas:
            return

        itens = [
            {"nome": mat.nome, "tipo": "Material", "quantidade_atual": mat.quantidade_atual, "quantidade_minima": mat.quantidade_minima}
            for mat in materiais
        ] + [
            {"nome": peca.nome, "tipo": "Peça", "quantidade_atual": peca.quantidade_atual, "quantidade_minima": peca.quantidade_minima}
            for peca in pecas
        ]
        itens.sort(key=lambda i: i["nome"])

        gestores = (await db.execute(select(Funcionario).where(Funcionario.role == RoleFuncionario.gestor))).scalars().all()
        for gestor in gestores:
            await email_service.enviar_alerta_estoque_diario(gestor.email, itens)


def iniciar_scheduler():
    scheduler.add_job(verificar_manutencoes_proximas, "cron", hour=7, minute=0)
    scheduler.add_job(verificar_estoque_baixo, "cron", hour=7, minute=15)
    scheduler.start()
