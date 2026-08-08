import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class ManutencaoRegistroCreate(BaseModel):
    video_url: Optional[str] = None
    video_public_id: Optional[str] = None
    descricao: Optional[str] = None
    proxima_revisao: Optional[date] = None


class UsuarioResumo(BaseModel):
    id: uuid.UUID
    nome_completo: str
    cargo: str
    model_config = {"from_attributes": True}


class ManutencaoRegistroOut(BaseModel):
    id: uuid.UUID
    ativo_id: uuid.UUID
    data_hora: datetime
    video_url: Optional[str]
    descricao: Optional[str]
    proxima_revisao: Optional[date]
    usuario: UsuarioResumo
    model_config = {"from_attributes": True}
