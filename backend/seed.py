import asyncio
from app.database import engine, Base, AsyncSessionLocal
from app.models.funcionario import Funcionario, RoleFuncionario
from app.utils.security import gerar_hash_senha


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        existente = await db.execute(select(Funcionario).where(Funcionario.login == "pancini"))
        if existente.scalar_one_or_none():
            print("Gestor já existe, pulando seed.")
            return

        gestor = Funcionario(
            nome_completo="Eduardo Pancini",
            cpf="00000000000",
            cargo="Proprietário",
            email="pancini@seagro.com.br",
            login="pancini",
            senha_hash=gerar_hash_senha("Seagro@2026"),
            role=RoleFuncionario.gestor,
            deve_trocar_senha=True,
        )
        db.add(gestor)
        await db.commit()
        print("Usuário gestor criado: login=pancini senha=Seagro@2026 (troque no primeiro acesso)")


if __name__ == "__main__":
    asyncio.run(seed())
