import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.ativo import Ativo
from app.models.codigo import StatusCodigo
from app.services.qrcode_service import gerar_qrcode_ativo
from app.services.auditoria_service import registrar_auditoria
from app.services.codigo_service import CodigoService


class AtivoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def criar(self, dados: dict, usuario_id: uuid.UUID) -> Ativo:
        existente = await self.db.execute(select(Ativo).where(Ativo.codigo_interno == dados["codigo_interno"]))
        if existente.scalar_one_or_none():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Código interno já cadastrado")

        codigo_service = CodigoService(self.db)
        codigo_pre = await codigo_service.buscar_por_codigo(dados["codigo_interno"])
        if codigo_pre and codigo_pre.status == StatusCodigo.EM_USO:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Este código já está em uso por outro ativo")

        ativo = Ativo(**dados)
        self.db.add(ativo)
        await self.db.flush()

        if codigo_pre:
            await codigo_service.marcar_em_uso(codigo_pre, ativo.id)

        ativo.qr_code_url = gerar_qrcode_ativo(ativo.id, ativo.codigo_interno)
        await self.db.commit()
        await registrar_auditoria(self.db, usuario_id, "ativos", "CREATE", ativo.id, None, {"codigo_interno": ativo.codigo_interno})
        return ativo

    async def buscar_por_id(self, ativo_id: uuid.UUID) -> Ativo:
        ativo = await self.db.get(Ativo, ativo_id)
        if not ativo:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ativo não encontrado")
        return ativo

    async def buscar_por_codigo(self, codigo_interno: str) -> Ativo:
        resultado = await self.db.execute(select(Ativo).where(Ativo.codigo_interno == codigo_interno))
        ativo = resultado.scalar_one_or_none()
        if not ativo:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Nenhum ativo cadastrado com este código ainda")
        return ativo

    async def listar(self, categoria=None, status_filtro=None, responsavel_id=None):
        query = select(Ativo).where(Ativo.ativo == True)
        if categoria:
            query = query.where(Ativo.categoria == categoria)
        if status_filtro:
            query = query.where(Ativo.status == status_filtro)
        if responsavel_id:
            query = query.where(Ativo.responsavel_id == responsavel_id)
        query = query.order_by(Ativo.modelo, Ativo.codigo_interno)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def atualizar(self, ativo_id: uuid.UUID, dados: dict, usuario_id: uuid.UUID) -> Ativo:
        ativo = await self.buscar_por_id(ativo_id)
        antes = {"status": ativo.status.value}
        # dados já vem filtrado com exclude_unset=True no router, então toda chave aqui
        # foi explicitamente enviada pelo cliente (mesmo que o valor seja None) -- por
        # isso aplicamos direto, sem pular None, permitindo por ex. limpar responsavel_id.
        for campo, valor in dados.items():
            setattr(ativo, campo, valor)
        await self.db.commit()
        dados_log = self._serializar_para_json(dados)
        await registrar_auditoria(self.db, usuario_id, "ativos", "UPDATE", ativo.id, antes, dados_log)
        return ativo

    @staticmethod
    def _serializar_para_json(dados: dict) -> dict:
        """Converte valores não-JSON-serializáveis (Decimal, date, datetime) antes de salvar no log de auditoria (coluna JSONB)."""
        resultado = {}
        for campo, valor in dados.items():
            if isinstance(valor, Decimal):
                resultado[campo] = float(valor)
            elif isinstance(valor, (date, datetime)):
                resultado[campo] = valor.isoformat()
            elif isinstance(valor, uuid.UUID):
                resultado[campo] = str(valor)
            elif isinstance(valor, PyEnum):
                resultado[campo] = valor.value
            else:
                resultado[campo] = valor
        return resultado
