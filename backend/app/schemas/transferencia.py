import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.transferencia import StatusTransferencia, DestinoTransferencia

class TransferenciaCreate(BaseModel):
    ativo_id: uuid.UUID
    destino: DestinoTransferencia = DestinoTransferencia.FUNCIONARIO
    novo_responsavel_id: uuid.UUID | None = None
    motivo_solicitacao: str | None = None

    @model_validator(mode="after")
    def valida_destino(self):
        if self.destino == DestinoTransferencia.FUNCIONARIO and not self.novo_responsavel_id:
            raise ValueError("Selecione o novo responsável.")
        if self.destino != DestinoTransferencia.FUNCIONARIO:
            # Depósito/Manutenção não têm uma pessoa responsável.
            self.novo_responsavel_id = None
        return self

class TransferenciaDecisao(BaseModel):
    aprovar: bool
    motivo_rejeicao: str | None = None

class TransferenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    ativo_id: uuid.UUID
    solicitante_id: uuid.UUID
    responsavel_atual_id: uuid.UUID
    destino: DestinoTransferencia
    novo_responsavel_id: uuid.UUID | None = None
    status: StatusTransferencia
    motivo_solicitacao: str | None = None
    motivo_rejeicao: str | None = None
    aprovador_id: uuid.UUID | None = None
    solicitado_em: datetime
    aprovado_rejeitado_em: datetime | None = None
    concluido_em: datetime | None = None
