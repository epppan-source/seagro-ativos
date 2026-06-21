import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.ativo import CategoriaAtivo


class StatusCodigo(str, PyEnum):
    DISPONIVEL = "DISPONIVEL"
    EM_USO = "EM_USO"


class CodigoPreImpresso(Base):
    __tablename__ = "codigos_pre_impressos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    categoria: Mapped[CategoriaAtivo] = mapped_column(Enum(CategoriaAtivo), nullable=False)
    status: Mapped[StatusCodigo] = mapped_column(Enum(StatusCodigo), default=StatusCodigo.DISPONIVEL)
    ativo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ativos.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
