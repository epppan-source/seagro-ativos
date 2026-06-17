import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from decimal import Decimal
from sqlalchemy import String, Text, DateTime, Date, Numeric, ForeignKey, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class StatusManutencao(str, PyEnum):
    AGENDADA = "AGENDADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"

class Manutencao(Base):
    __tablename__ = "manutencoes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ativo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ativos.id"), nullable=False)
    tipo_manutencao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tipos_manutencao.id"), nullable=False)
    data_manutencao: Mapped[date] = mapped_column(Date, nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    responsavel_tecnico_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    custo_total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[StatusManutencao] = mapped_column(Enum(StatusManutencao), default=StatusManutencao.AGENDADA)
    proxima_manutencao: Mapped[date | None] = mapped_column(Date)
    observacoes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ativo: Mapped["Ativo"] = relationship("Ativo", back_populates="manutencoes")
    tipo_manutencao: Mapped["TipoManutencao"] = relationship("TipoManutencao")
    responsavel_tecnico: Mapped["Funcionario"] = relationship("Funcionario", back_populates="manutencoes_realizadas")
    fotos: Mapped[list["ManutencaoFoto"]] = relationship("ManutencaoFoto", back_populates="manutencao")
    pecas_utilizadas: Mapped[list["PecaUtilizada"]] = relationship("PecaUtilizada", back_populates="manutencao")

class ManutencaoFoto(Base):
    __tablename__ = "manutencao_fotos"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    manutencao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("manutencoes.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    manutencao: Mapped["Manutencao"] = relationship("Manutencao", back_populates="fotos")

class PecaUtilizada(Base):
    __tablename__ = "pecas_utilizadas"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    manutencao_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("manutencoes.id"), nullable=False)
    tipo_peca_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tipos_peca_reposicao.id"))
    descricao_peca: Mapped[str] = mapped_column(String(200), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, default=1)
    custo_unitario: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    custo_total: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    manutencao: Mapped["Manutencao"] = relationship("Manutencao", back_populates="pecas_utilizadas")
