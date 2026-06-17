import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.transferencia import StatusTransferencia

class TransferenciaCreate(BaseModel):
    ativo_id: uuid.UUID
    novo_responsavel_id: uuid.UUID
    motivo_solicitacao: str | None = None

class TransferenciaDecisao(BaseModel):
    aprovar: bool
    motivo_rejeicao: str | None = None

class TransferenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    ativo_id: uuid.UUID
    solicitante_id: uuid.UUID
    responsavel_atual_id: uuid.UUID
    novo_responsavel_id: uuid.UUID
    status: StatusTransferencia
    motivo_solicitacao: str | None = None
    motivo_rejeicao: str | None = None
    aprovador_id: uuid.UUID | None = None
    solicitado_em: datetime
    aprovado_rejeitado_em: datetime | None = None
    concluido_em: datetime | None = None
