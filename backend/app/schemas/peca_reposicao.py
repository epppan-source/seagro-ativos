import uuid
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, field_validator


class PecaReposicaoBase(BaseModel):
    nome: str
    tipo_peca_reposicao_id: uuid.UUID
    descricao: str | None = None
    unidade: str = "un"
    quantidade_minima: Decimal = Decimal("0")
    responsavel_id: uuid.UUID | None = None


class PecaReposicaoCreate(PecaReposicaoBase):
    codigo: str
    quantidade_atual: Decimal = Decimal("0")


class PecaReposicaoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    quantidade_minima: Decimal | None = None
    responsavel_id: uuid.UUID | None = None
    ativo: bool | None = None


class PecaReposicaoOut(PecaReposicaoBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    codigo: str
    quantidade_atual: Decimal
    foto_url: str | None = None
    ativo: bool
    created_at: datetime
    updated_at: datetime


class PecaMovimentoCreate(BaseModel):
    quantidade: Decimal
    tipo: str  # ENTRADA ou SAIDA
    data: date = date.today()
    ativo_id: uuid.UUID | None = None
    observacao: str | None = None

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in ("ENTRADA", "SAIDA"):
            raise ValueError("tipo deve ser ENTRADA ou SAIDA")
        return v


class PecaMovimentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    peca_id: uuid.UUID
    tipo: str
    quantidade: Decimal
    data: date
    ativo_id: uuid.UUID | None = None
    observacao: str | None = None
    registrado_por_id: uuid.UUID | None = None
    created_at: datetime
