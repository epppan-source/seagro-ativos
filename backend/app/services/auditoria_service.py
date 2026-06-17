import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auditoria import Auditoria


async def registrar_auditoria(
    db: AsyncSession,
    funcionario_id: uuid.UUID | None,
    tabela: str,
    operacao: str,
    registro_id: uuid.UUID | None = None,
    dados_antes: dict | None = None,
    dados_depois: dict | None = None,
):
    log = Auditoria(
        funcionario_id=funcionario_id,
        tabela=tabela,
        operacao=operacao,
        registro_id=registro_id,
        dados_antes=dados_antes,
        dados_depois=dados_depois,
    )
    db.add(log)
    await db.commit()
