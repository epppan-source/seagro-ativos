import uuid
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Boolean, Text, DateTime, Date, Numeric, ForeignKey
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
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tipo_material: Mapped["TipoMaterial"] = relationship("TipoMaterial")
    responsavel: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[responsavel_id])


class MaterialMovimento(Base):
    """Histórico de movimentações de estoque de Materiais.

    Registra cada entrada/saída com o ativo destino (quando aplicável),
    quem registrou e a data — mesmo padrão de PecaMovimento.
    """

    __tablename__ = "material_movimentos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    material_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("materiais.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False)  # ENTRADA ou SAIDA
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    data: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    ativo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("ativos.id"), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text)
    registrado_por_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    material: Mapped["Material"] = relationship("Material")
    ativo: Mapped["Ativo"] = relationship("Ativo")
    registrado_por: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[registrado_por_id])
