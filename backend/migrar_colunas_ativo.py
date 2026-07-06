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
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS material_movimentos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                material_id UUID NOT NULL REFERENCES materiais(id),
                tipo VARCHAR(10) NOT NULL,
                quantidade NUMERIC(12, 2) NOT NULL,
                data DATE NOT NULL DEFAULT CURRENT_DATE,
                ativo_id UUID REFERENCES ativos(id),
                observacao TEXT,
                registrado_por_id UUID REFERENCES funcionarios(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    print("OK: colunas ativos + tabela material_movimentos confirmadas.")


if __name__ == "__main__":
    asyncio.run(migrar())
