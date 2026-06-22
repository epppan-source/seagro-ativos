"""
Migração one-off: adiciona à tabela `ativos` as colunas novas usadas por:
- Task #31: data prevista de revisão
- Task #35: aposentar equipamento (data + motivo)

Idempotente (ADD COLUMN IF NOT EXISTS) - seguro de rodar mais de uma vez.

Uso (local ou via startCommand temporário no Railway):
    python migrar_colunas_ativo.py
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def migrar():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE ativos ADD COLUMN IF NOT EXISTS data_revisao_prevista DATE"))
        await conn.execute(text("ALTER TABLE ativos ADD COLUMN IF NOT EXISTS aposentado_em DATE"))
        await conn.execute(text("ALTER TABLE ativos ADD COLUMN IF NOT EXISTS motivo_aposentadoria TEXT"))
    print("OK: colunas data_revisao_prevista, aposentado_em, motivo_aposentadoria confirmadas em ativos.")


if __name__ == "__main__":
    asyncio.run(migrar())
