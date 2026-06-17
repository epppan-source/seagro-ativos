import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Auditoria(Base):
    __tablename__ = "auditoria"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    funcionario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"))
    tabela: Mapped[str] = mapped_column(String(100), nullable=False)
    operacao: Mapped[str] = mapped_column(String(20), nullable=False)
    registro_id: Mapped[uuid.UUID | None]
    dados_antes: Mapped[dict | None] = mapped_column(JSONB)
    dados_depois: Mapped[dict | None] = mapped_column(JSONB)
    ip_address: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
