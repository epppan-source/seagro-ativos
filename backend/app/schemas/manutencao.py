import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.manutencao import StatusManutencao

class PecaUtilizadaIn(BaseModel):
    tipo_peca_id: uuid.UUID | None = None
    descricao_peca: str
    quantidade: int = 1
    custo_unitario: Decimal | None = None

class ManutencaoCreate(BaseModel):
    ativo_id: uuid.UUID
    tipo_manutencao_id: uuid.UUID
    data_manutencao: date
    descricao: str
    responsavel_tecnico_id: uuid.UUID
    custo_total: Decimal | None = None
    proxima_manutencao: date | None = None
    observacoes: str | None = None
    pecas: list[PecaUtilizadaIn] = []

class ManutencaoUpdate(BaseModel):
    status: StatusManutencao | None = None
    custo_total: Decimal | None = None
    proxima_manutencao: date | None = None
    observacoes: str | None = None

class ManutencaoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    ativo_id: uuid.UUID
    tipo_manutencao_id: uuid.UUID
    data_manutencao: date
    descricao: str
    responsavel_tecnico_id: uuid.UUID
    custo_total: Decimal | None = None
    status: StatusManutencao
    proxima_manutencao: date | None = None
    observacoes: str | None = None
    created_at: datetime
