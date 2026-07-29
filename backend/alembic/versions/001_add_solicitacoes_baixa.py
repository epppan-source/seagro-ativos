"""add solicitacoes_baixa table

Revision ID: 001_add_solicitacoes_baixa
Revises:
Create Date: 2026-07-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_add_solicitacoes_baixa"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE IF NOT EXISTS statusbaixa AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA')")
    op.execute("CREATE TYPE IF NOT EXISTS tipoitembaixa AS ENUM ('MATERIAL', 'PECA')")

    op.create_table(
        "solicitacoes_baixa",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("solicitante_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("funcionarios.id"), nullable=False),
        sa.Column("tipo_item", sa.Enum("MATERIAL", "PECA", name="tipoitembaixa"), nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("materiais.id"), nullable=True),
        sa.Column("peca_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pecas_reposicao.id"), nullable=True),
        sa.Column("quantidade", sa.Numeric(12, 2), nullable=False),
        sa.Column("obra", sa.String(300), nullable=False),
        sa.Column("status", sa.Enum("PENDENTE", "APROVADA", "REJEITADA", name="statusbaixa"), nullable=False, server_default="PENDENTE"),
        sa.Column("aprovador_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("funcionarios.id"), nullable=True),
        sa.Column("motivo_rejeicao", sa.Text(), nullable=True),
        sa.Column("solicitado_em", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("aprovado_rejeitado_em", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("solicitacoes_baixa")
    op.execute("DROP TYPE IF EXISTS statusbaixa")
    op.execute("DROP TYPE IF EXISTS tipoitembaixa")
