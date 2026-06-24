import uuid
from datetime import datetime, date
from enum import Enum as PyEnum
from decimal import Decimal
from sqlalchemy import String, Boolean, Text, DateTime, Date, Numeric, ForeignKey, Enum, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class StatusAtivo(str, PyEnum):
    NA_MAO_FUNCIONARIO = "NA_MAO_FUNCIONARIO"
    NO_DEPOSITO = "NO_DEPOSITO"
    EM_MANUTENCAO = "EM_MANUTENCAO"
    INATIVO = "INATIVO"

class CategoriaAtivo(str, PyEnum):
    EQUIPAMENTO = "EQUIPAMENTO"
    FERRAMENTA = "FERRAMENTA"
    ACESSORIO = "ACESSORIO"

class Ativo(Base):
    __tablename__ = "ativos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo_interno: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    categoria: Mapped[CategoriaAtivo] = mapped_column(Enum(CategoriaAtivo), nullable=False)
    tipo_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    modelo: Mapped[str] = mapped_column(String(200))
    marca: Mapped[str] = mapped_column(String(100))
    numero_serie: Mapped[str | None] = mapped_column(String(100))
    ano_fabricacao: Mapped[int | None] = mapped_column(Integer)
    valor: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[StatusAtivo] = mapped_column(Enum(StatusAtivo), default=StatusAtivo.NO_DEPOSITO)
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text)
    qr_code_url: Mapped[str | None] = mapped_column(String(500))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    data_revisao_prevista: Mapped[date | None] = mapped_column(Date)
    aposentado_em: Mapped[date | None] = mapped_column(Date)
    motivo_aposentadoria: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responsavel: Mapped["Funcionario"] = relationship(
        "Funcionario", back_populates="ativos_responsavel", foreign_keys=[responsavel_id]
    )
    fotos: Mapped[list["AtivoFoto"]] = relationship("AtivoFoto", back_populates="ativo")
    documentos: Mapped[list["AtivoDocumento"]] = relationship("AtivoDocumento", back_populates="ativo")
    manutencoes: Mapped[list["Manutencao"]] = relationship("Manutencao", back_populates="ativo")
    transferencias: Mapped[list["Transferencia"]] = relationship("Transferencia", back_populates="ativo")

class AtivoFoto(Base):
    __tablename__ = "ativo_fotos"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ativo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ativos.id"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ativo: Mapped["Ativo"] = relationship("Ativo", back_populates="fotos")

# Documentos anexados a um ativo (ex.: certificado de calibracao, nota fiscal,
# manual, garantia). Cada anexo guarda um nome dado pelo usuario, um tipo/categoria
# livre (ex.: CALIBRACAO, NOTA_FISCAL) e a URL do arquivo.
class AtivoDocumento(Base):
    __tablename__ = "ativo_documentos"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ativo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ativos.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(50), default="OUTRO")
    arquivo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    nome_arquivo_original: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ativo: Mapped["Ativo"] = relationship("Ativo", back_populates="documentos")
