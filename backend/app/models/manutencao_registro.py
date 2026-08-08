import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ManutencaoRegistro(Base):
    __tablename__ = "manutencao_registros"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ativo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ativos.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"), nullable=False)
    data_hora: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    video_url: Mapped[str | None] = mapped_column(Text)
    video_public_id: Mapped[str | None] = mapped_column(String(300))
    descricao: Mapped[str | None] = mapped_column(Text)
    proxima_revisao: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped["Funcionario"] = relationship("Funcionario", foreign_keys=[usuario_id])
    ativo: Mapped["Ativo"] = relationship("Ativo", foreign_keys=[ativo_id])
