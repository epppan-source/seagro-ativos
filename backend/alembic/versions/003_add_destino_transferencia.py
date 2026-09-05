"""add destino (Depósito/Manutenção/Funcionário) na transferencia, novo_responsavel_id opcional

Revision ID: 003_destino_transferencia
Revises: 002_pode_transferir_ativo
Create Date: 2026-09-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003_destino_transferencia"
down_revision = "002_pode_transferir_ativo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE destinotransferencia AS ENUM ('FUNCIONARIO', 'DEPOSITO', 'MANUTENCAO')")

    destino_enum = postgresql.ENUM(
        "FUNCIONARIO", "DEPOSITO", "MANUTENCAO",
        name="destinotransferencia",
        create_type=False,
    )
    op.add_column(
        "transferencias",
        sa.Column("destino", destino_enum, nullable=False, server_default="FUNCIONARIO"),
    )

    # Antes, novo_responsavel_id era sempre obrigatório (só dava pra
    # transferir pra outra pessoa). Agora, quando destino é Depósito ou
    # Manutenção, esse campo fica vazio de propósito.
    op.alter_column(
        "transferencias",
        "novo_responsavel_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "transferencias",
        "novo_responsavel_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
    op.drop_column("transferencias", "destino")
    op.execute("DROP TYPE IF EXISTS destinotransferencia")
