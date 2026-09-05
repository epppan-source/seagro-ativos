"""add destino (Depósito/Manutenção/Funcionário) na transferencia, novo_responsavel_id opcional

Revision ID: 003_destino_transferencia
Revises: 002_pode_transferir_ativo
Create Date: 2026-09-05

"""
from alembic import op

revision = "003_destino_transferencia"
down_revision = "002_pode_transferir_ativo"
branch_labels = None
depends_on = None


# Escrita pra ser segura de rodar não importa o estado em que o banco já
# esteja (inclusive se uma tentativa anterior já tiver criado parte disso) --
# cada passo checa se já foi feito antes de fazer de novo.
def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE TYPE destinotransferencia AS ENUM ('FUNCIONARIO', 'DEPOSITO', 'MANUTENCAO');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END
        $$;
        """
    )

    op.execute(
        """
        ALTER TABLE transferencias
        ADD COLUMN IF NOT EXISTS destino destinotransferencia NOT NULL DEFAULT 'FUNCIONARIO'
        """
    )

    # Antes, novo_responsavel_id era sempre obrigatório (só dava pra
    # transferir pra outra pessoa). Agora, quando destino é Depósito ou
    # Manutenção, esse campo fica vazio de propósito.
    op.execute(
        """
        ALTER TABLE transferencias
        ALTER COLUMN novo_responsavel_id DROP NOT NULL
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE transferencias
        ALTER COLUMN novo_responsavel_id SET NOT NULL
        """
    )
    op.execute("ALTER TABLE transferencias DROP COLUMN IF EXISTS destino")
    op.execute("DROP TYPE IF EXISTS destinotransferencia")
