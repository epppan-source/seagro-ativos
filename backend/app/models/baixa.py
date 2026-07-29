import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import Text, DateTime, ForeignKey, Enum, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class StatusBaixa(str, PyEnum):
    PENDENTE = "PENDENTE"
    APROVADA = "APROVADA"
    REJEITADA = "REJEITADA"


class TipoItemBaixa(str, PyEnum):
    MATERIAL = "MATERIAL"
    PECA = "PECA"


class SolicitacaoBaixa(Base):
    __tablename__ = "solicitacoes_baixa"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    solicitante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    tipo_item: Mapped[TipoItemBaixa] = mapped_column(Enum(TipoItemBaixa), nullable=False)
    material_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("materiais.id"), nullable=True)
    peca_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("pecas_reposicao.id"), nullable=True)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    obra: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[StatusBaixa] = mapped_column(Enum(StatusBaixa), default=StatusBaixa.PENDENTE)
    aprovador_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"), nullable=True)
    motivo_rejeicao: Mapped[str | None] = mapped_column(Text)
    solicitado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    aprovado_rejeitado_em: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    solicitante: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[solicitante_id])
    aprovador: Mapped["Funcionario | None"] = relationship("Funcionario", foreign_keys=[aprovador_id])
    material: Mapped["Material | None"] = relationship("Material")
    peca: Mapped["PecaReposicao | None"] = relationship("PecaReposicao")
