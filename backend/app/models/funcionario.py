import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class RoleFuncionario(str, PyEnum):
    gestor = "gestor"
    funcionario = "funcionario"

class Funcionario(Base):
    __tablename__ = "funcionarios"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nome_completo: Mapped[str] = mapped_column(String(200), nullable=False)
    cpf: Mapped[str] = mapped_column(String(14), unique=True, nullable=False)
    cargo: Mapped[str] = mapped_column(String(100))
    telefone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    foto_url: Mapped[str | None] = mapped_column(String(500))
    login: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[RoleFuncionario] = mapped_column(Enum(RoleFuncionario), default=RoleFuncionario.funcionario)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    deve_trocar_senha: Mapped[bool] = mapped_column(Boolean, default=False)
    reset_token: Mapped[str | None] = mapped_column(String(200), nullable=True)
    reset_token_expira_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ativos_responsavel: Mapped[list["Ativo"]] = relationship(
        "Ativo", back_populates="responsavel", foreign_keys="Ativo.responsavel_id"
    )
    transferencias_solicitadas: Mapped[list["Transferencia"]] = relationship(
        "Transferencia", back_populates="solicitante", foreign_keys="Transferencia.solicitante_id"
    )
    manutencoes_realizadas: Mapped[list["Manutencao"]] = relationship(
        "Manutencao", back_populates="responsavel_tecnico"
    )
