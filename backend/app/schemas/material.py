import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class MaterialBase(BaseModel):
    nome: str
    tipo_material_id: uuid.UUID
    descricao: str | None = None
    unidade: str = "un"
    quantidade_minima: Decimal = Decimal("0")
    responsavel_id: uuid.UUID | None = None

class MaterialCreate(MaterialBase):
    codigo: str
    quantidade_atual: Decimal = Decimal("0")

class MaterialUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    quantidade_minima: Decimal | None = None
    responsavel_id: uuid.UUID | None = None
    ativo: bool | None = None

class MaterialMovimento(BaseModel):
    quantidade: Decimal
    tipo: str  # ENTRADA ou SAIDA
    observacao: str | None = None

class MaterialOut(MaterialBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    codigo: str
    quantidade_atual: Decimal
    foto_url: str | None = None
    ativo: bool
    created_at: datetime
    updated_at: datetime
