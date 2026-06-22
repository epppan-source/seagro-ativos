import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Boolean, Text, DateTime, Date, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class PecaReposicao(Base):
    __tablename__ = "pecas_reposicao"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_peca_reposicao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tipos_peca_reposicao.id"), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    foto_url: Mapped[str | None] = mapped_column(String(500))
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    quantidade_atual: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    quantidade_minima: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tipo_peca_reposicao: Mapped["TipoPecaReposicao"] = relationship("TipoPecaReposicao")


class PecaMovimento(Base):
    """Histórico de movimentações de estoque de Peças de Reposição.

    Diferente de Material, aqui guardamos um registro permanente de cada
    entrada/saída — em especial a SAIDA que documenta em qual Ativo a peça
    foi instalada e em que data, conforme pedido do usuário (ex.: "tirei a
    peça X do estoque e substitui na máquina EQ-001 em 10/06/2026").
    """

    __tablename__ = "pecas_movimentos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    peca_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pecas_reposicao.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # ENTRADA ou SAIDA
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    data: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    ativo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ativos.id"), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text)
    registrado_por_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    peca: Mapped["PecaReposicao"] = relationship("PecaReposicao")
    ativo: Mapped["Ativo"] = relationship("Ativo")
    registrado_por: Mapped["Funcionario"] = relationship("Funcionario")
