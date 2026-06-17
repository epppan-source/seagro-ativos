import uuid
from pydantic import BaseModel, ConfigDict

class TipoBase(BaseModel):
    nome: str
    descricao: str | None = None

class TipoCreate(TipoBase):
    pass

class TipoOut(TipoBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    ativo: bool
