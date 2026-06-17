import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, Text, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Material(Base):
    __tablename__ = "materiais"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tipos_material.id"), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text)
    foto_url: Mapped[str | None] = mapped_column(String(500))
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    quantidade_atual: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    quantidade_minima: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tipo_material: Mapped["TipoMaterial"] = relationship("TipoMaterial")
