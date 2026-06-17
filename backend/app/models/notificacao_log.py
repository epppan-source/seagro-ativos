import uuid
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class NotificacaoLog(Base):
    __tablename__ = "notificacoes_log"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    destinatario_email: Mapped[str] = mapped_column(String(200), nullable=False)
    assunto: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(20), default="ENVIADO")
    erro: Mapped[str | None] = mapped_column(String(500))
    referencia_id: Mapped[uuid.UUID | None]
    referencia_tipo: Mapped[str | None] = mapped_column(String(50))
    enviado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
