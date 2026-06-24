"""
Migracao one-off: cria a tabela `ativo_documentos` (Task #42 - anexar documentos
como calibracao, NF, manual etc a um Ativo).

Idempotente (CREATE TABLE IF NOT EXISTS) - seguro de rodar mais de uma vez.

Uso (local ou via startCommand temporario no Railway):
    python migrar_tabela_documentos.py
"""

import asyncio
from sqlalchemy import text
from app.database import engine


async def migrar():
    async with engine.begin() as conn:
        await conn.execute(text(
            """
            CREATE TABLE IF NOT EXISTS ativo_documentos (
                id UUID PRIMARY KEY,
                ativo_id UUID NOT NULL REFERENCES ativos(id),
                nome VARCHAR(200) NOT NULL,
                tipo_documento VARCHAR(50) DEFAULT 'OUTRO',
                arquivo_url VARCHAR(500) NOT NULL,
                nome_arquivo_original VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            )
            """
        ))
    print("OK: tabela ativo_documentos confirmada.")


if __name__ == "__main__":
    asyncio.run(migrar())
