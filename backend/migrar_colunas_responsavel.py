"""
Migração one-off: adiciona a coluna `responsavel_id` (FK -> funcionarios.id)
nas tabelas `materiais` e `pecas_reposicao` (Tasks #39 e #40).

Idempotente (ADD COLUMN IF NOT EXISTS) - seguro de rodar mais de uma vez.

Uso (local ou via startCommand temporário no Railway):
    python migrar_colunas_responsavel.py
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def migrar():
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE materiais ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES funcionarios(id)"
        ))
        await conn.execute(text(
            "ALTER TABLE pecas_reposicao ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES funcionarios(id)"
        ))
    print("OK: coluna responsavel_id confirmada em materiais e pecas_reposicao.")


if __name__ == "__main__":
    asyncio.run(migrar())
