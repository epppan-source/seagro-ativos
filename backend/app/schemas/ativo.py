import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.ativo import StatusAtivo, CategoriaAtivo

class AtivoBase(BaseModel):
    categoria: CategoriaAtivo
    tipo_id: uuid.UUID
    modelo: str
    marca: str
    numero_serie: str | None = None
    ano_fabricacao: int | None = None
    valor: Decimal | None = None
    observacoes: str | None = None

class AtivoCreate(AtivoBase):
    codigo_interno: str
    responsavel_id: uuid.UUID | None = None

class AtivoUpdate(BaseModel):
    modelo: str | None = None
    marca: str | None = None
    numero_serie: str | None = None
    ano_fabricacao: int | None = None
    valor: Decimal | None = None
    observacoes: str | None = None
    status: StatusAtivo | None = None
    ativo: bool | None = None

class AtivoOut(AtivoBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    codigo_interno: str
    status: StatusAtivo
    responsavel_id: uuid.UUID | None = None
    qr_code_url: str | None = None
    ativo: bool
    created_at: datetime
    updated_at: datetime
