import uuid
from pydantic import BaseModel, ConfigDict
from app.models.ativo import CategoriaAtivo
from app.models.codigo import StatusCodigo


class CodigoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    codigo: str
    categoria: CategoriaAtivo
    status: StatusCodigo
    ativo_id: uuid.UUID | None = None


class ResumoCategoria(BaseModel):
    categoria: str
    disponivel: int
    em_uso: int
    total: int
