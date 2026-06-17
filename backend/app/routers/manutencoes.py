import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.manutencao import ManutencaoCreate, ManutencaoUpdate, ManutencaoOut
from app.models.manutencao import Manutencao, PecaUtilizada
from app.models.ativo import Ativo, StatusAtivo

router = APIRouter(prefix="/api/manutencoes", tags=["manutencoes"])


@router.get("", response_model=list[ManutencaoOut])
async def listar(ativo_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    query = select(Manutencao)
    if ativo_id:
        query = query.where(Manutencao.ativo_id == ativo_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ManutencaoOut)
async def criar(dados: ManutencaoCreate, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    pecas = dados.pecas
    manutencao = Manutencao(**dados.model_dump(exclude={"pecas"}))
    db.add(manutencao)
    await db.flush()

    for peca in pecas:
        custo_total = (peca.custo_unitario or 0) * peca.quantidade
        db.add(PecaUtilizada(manutencao_id=manutencao.id, custo_total=custo_total, **peca.model_dump()))

    ativo = await db.get(Ativo, dados.ativo_id)
    if ativo:
        ativo.status = StatusAtivo.EM_MANUTENCAO

    await db.commit()
    return manutencao


@router.put("/{manutencao_id}", response_model=ManutencaoOut)
async def atualizar(manutencao_id: uuid.UUID, dados: ManutencaoUpdate, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    manutencao = await db.get(Manutencao, manutencao_id)
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(manutencao, campo, valor)

    if dados.status and dados.status.value == "CONCLUIDA":
        ativo = await db.get(Ativo, manutencao.ativo_id)
        if ativo:
            ativo.status = StatusAtivo.NO_DEPOSITO

    await db.commit()
    return manutencao
