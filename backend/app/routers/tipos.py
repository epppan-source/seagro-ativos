from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.tipos import TipoCreate, TipoOut
from app.models.tipos import (
    TipoEquipamento, TipoFerramenta, TipoAcessorio, TipoMaterial, TipoManutencao, TipoPecaReposicao,
)

router = APIRouter(prefix="/api/tipos", tags=["tipos"])

_MODELOS = {
    "equipamento": TipoEquipamento, "ferramenta": TipoFerramenta, "acessorio": TipoAcessorio,
    "material": TipoMaterial, "manutencao": TipoManutencao, "peca-reposicao": TipoPecaReposicao,
}


def _modelo(categoria: str):
    if categoria not in _MODELOS:
        from fastapi import HTTPException, status
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoria de tipo inválida")
    return _MODELOS[categoria]


@router.get("/{categoria}", response_model=list[TipoOut])
async def listar(categoria: str, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    Modelo = _modelo(categoria)
    result = await db.execute(select(Modelo).where(Modelo.ativo == True))
    return result.scalars().all()


@router.post("/{categoria}", response_model=TipoOut, dependencies=[Depends(require_role("gestor"))])
async def criar(categoria: str, dados: TipoCreate, db: AsyncSession = Depends(get_db)):
    Modelo = _modelo(categoria)
    novo = Modelo(**dados.model_dump())
    db.add(novo)
    await db.commit()
    return novo
