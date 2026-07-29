import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.models.baixa import StatusBaixa, TipoItemBaixa


class FuncionarioSimples(BaseModel):
    id: uuid.UUID
    nome_completo: str
    email: str
    model_config = {"from_attributes": True}


class MaterialSimples(BaseModel):
    id: uuid.UUID
    nome: str
    unidade: str
    model_config = {"from_attributes": True}


class PecaSimples(BaseModel):
    id: uuid.UUID
    nome: str
    unidade: str
    model_config = {"from_attributes": True}


class SolicitacaoBaixaCreate(BaseModel):
    tipo_item: TipoItemBaixa
    material_id: uuid.UUID | None = None
    peca_id: uuid.UUID | None = None
    quantidade: Decimal
    obra: str


class SolicitacaoBaixaDecisao(BaseModel):
    aprovar: bool
    motivo_rejeicao: str | None = None


class SolicitacaoBaixaOut(BaseModel):
    id: uuid.UUID
    solicitante: FuncionarioSimples
    tipo_item: TipoItemBaixa
    material: MaterialSimples | None
    peca: PecaSimples | None
    quantidade: Decimal
    obra: str
    status: StatusBaixa
    aprovador: FuncionarioSimples | None
    motivo_rejeicao: str | None
    solicitado_em: datetime
    aprovado_rejeitado_em: datetime | None
    model_config = {"from_attributes": True}
