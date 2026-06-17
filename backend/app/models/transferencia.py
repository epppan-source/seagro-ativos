import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class StatusTransferencia(str, PyEnum):
    PENDENTE = "PENDENTE"
    APROVADA = "APROVADA"
    REJEITADA = "REJEITADA"
    CANCELADA = "CANCELADA"

class Transferencia(Base):
    __tablename__ = "transferencias"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ativo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ativos.id"), nullable=False)
    solicitante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    responsavel_atual_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    novo_responsavel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    status: Mapped[StatusTransferencia] = mapped_column(Enum(StatusTransferencia), default=StatusTransferencia.PENDENTE)
    motivo_solicitacao: Mapped[str | None] = mapped_column(Text)
    motivo_rejeicao: Mapped[str | None] = mapped_column(Text)
    aprovador_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"))
    solicitado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    aprovado_rejeitado_em: Mapped[datetime | None] = mapped_column(DateTime)
    concluido_em: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ativo: Mapped["Ativo"] = relationship("Ativo", back_populates="transferencias")
    solicitante: Mapped["Funcionario"] = relationship(
        "Funcionario", foreign_keys=[solicitante_id], back_populates="transferencias_solicitadas"
    )
    responsavel_atual: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[responsavel_atual_id])
    novo_responsavel: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[novo_responsavel_id])
    aprovador: Mapped["Funcionario | None"] = relationship("Funcionario", foreign_keys=[aprovador_id])
