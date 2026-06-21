import uuid
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.codigo import CodigoPreImpresso, StatusCodigo
from app.models.ativo import CategoriaAtivo


class CodigoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar(self, categoria: str | None = None, status_filtro: str | None = None):
        query = select(CodigoPreImpresso)
        if categoria:
            query = query.where(CodigoPreImpresso.categoria == categoria)
        if status_filtro:
            query = query.where(CodigoPreImpresso.status == status_filtro)
        query = query.order_by(CodigoPreImpresso.codigo)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def resumo(self):
        resultado = []
        for categoria in CategoriaAtivo:
            total_q = await self.db.execute(
                select(func.count()).select_from(CodigoPreImpresso).where(CodigoPreImpresso.categoria == categoria)
            )
            disponivel_q = await self.db.execute(
                select(func.count()).select_from(CodigoPreImpresso).where(
                    CodigoPreImpresso.categoria == categoria,
                    CodigoPreImpresso.status == StatusCodigo.DISPONIVEL,
                )
            )
            total_n = total_q.scalar_one()
            disp_n = disponivel_q.scalar_one()
            resultado.append({
                "categoria": categoria.value,
                "disponivel": disp_n,
                "em_uso": total_n - disp_n,
                "total": total_n,
            })
        return resultado

    async def buscar_por_codigo(self, codigo_str: str) -> CodigoPreImpresso | None:
        result = await self.db.execute(select(CodigoPreImpresso).where(CodigoPreImpresso.codigo == codigo_str))
        return result.scalar_one_or_none()

    async def marcar_em_uso(self, registro: CodigoPreImpresso, ativo_id: uuid.UUID):
        registro.status = StatusCodigo.EM_USO
        registro.ativo_id = ativo_id
        await self.db.flush()

    async def liberar(self, registro: CodigoPreImpresso):
        registro.status = StatusCodigo.DISPONIVEL
        registro.ativo_id = None
        await self.db.flush()
