"""add pode_transferir_qualquer_ativo to funcionarios

Revision ID: 002_pode_transferir_ativo
Revises: 001_add_solicitacoes_baixa
Create Date: 2026-08-31

"""
from alembic import op
import sqlalchemy as sa

revision = "002_pode_transferir_ativo"
down_revision = "001_add_solicitacoes_baixa"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "funcionarios",
        sa.Column(
            "pode_transferir_qualquer_ativo",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade() -> None:
    op.drop_column("funcionarios", "pode_transferir_qualquer_ativo")
