import asyncio
from sqlalchemy import select
from app.database import engine, Base, AsyncSessionLocal
from app.models.codigo import CodigoPreImpresso, StatusCodigo
from app.models.ativo import Ativo, CategoriaAtivo

QTD_POR_CATEGORIA = {
    "EQ": (50, CategoriaAtivo.EQUIPAMENTO),
    "FE": (65, CategoriaAtivo.FERRAMENTA),
    "AC": (60, CategoriaAtivo.ACESSORIO),
}


async def seed_codigos():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existente = await db.execute(select(CodigoPreImpresso).limit(1))
        if existente.scalar_one_or_none():
            print("Códigos pré-impressos já existem, pulando seed.")
            return

        criados = 0
        for prefixo, (qtd, categoria) in QTD_POR_CATEGORIA.items():
            for i in range(1, qtd + 1):
                codigo_str = f"{prefixo}-{i:04d}"

                # reconcilia com ativos já cadastrados com esse código
                ativo_existente = await db.execute(
                    select(Ativo).where(Ativo.codigo_interno == codigo_str)
                )
                ativo = ativo_existente.scalar_one_or_none()

                registro = CodigoPreImpresso(
                    codigo=codigo_str,
                    categoria=categoria,
                    status=StatusCodigo.EM_USO if ativo else StatusCodigo.DISPONIVEL,
                    ativo_id=ativo.id if ativo else None,
                )
                db.add(registro)
                criados += 1

        await db.commit()
        print(f"{criados} códigos pré-impressos cadastrados (EQ/FE/AC).")


if __name__ == "__main__":
    asyncio.run(seed_codigos())
