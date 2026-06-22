import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.peca_reposicao import (
    PecaReposicaoCreate, PecaReposicaoUpdate, PecaReposicaoOut,
    PecaMovimentoCreate, PecaMovimentoOut,
)
from app.models.peca_reposicao import PecaReposicao, PecaMovimento
from app.models.ativo import Ativo

router = APIRouter(prefix="/api/pecas", tags=["pecas-reposicao"])


@router.get("", response_model=list[PecaReposicaoOut])
async def listar(db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    result = await db.execute(select(PecaReposicao).where(PecaReposicao.ativo == True))
    return result.scalars().all()


@router.post("", response_model=PecaReposicaoOut, dependencies=[Depends(require_role("gestor"))])
async def criar(dados: PecaReposicaoCreate, db: AsyncSession = Depends(get_db)):
    nova = PecaReposicao(**dados.model_dump())
    db.add(nova)
    await db.commit()
    return nova


@router.put("/{peca_id}", response_model=PecaReposicaoOut, dependencies=[Depends(require_role("gestor"))])
async def atualizar(peca_id: uuid.UUID, dados: PecaReposicaoUpdate, db: AsyncSession = Depends(get_db)):
    peca = await db.get(PecaReposicao, peca_id)
    if not peca:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peça não encontrada")
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(peca, campo, valor)
    await db.commit()
    return peca


@router.post("/{peca_id}/movimento", response_model=PecaReposicaoOut)
async def movimentar(
    peca_id: uuid.UUID,
    dados: PecaMovimentoCreate,
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user),
):
    peca = await db.get(PecaReposicao, peca_id)
    if not peca:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peça não encontrada")

    if dados.tipo == "SAIDA" and dados.ativo_id is not None:
        ativo = await db.get(Ativo, dados.ativo_id)
        if not ativo:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ativo informado não encontrado")

    if dados.tipo == "ENTRADA":
        peca.quantidade_atual += dados.quantidade
    elif dados.tipo == "SAIDA":
        if peca.quantidade_atual < dados.quantidade:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quantidade insuficiente em estoque")
        peca.quantidade_atual -= dados.quantidade

    movimento = PecaMovimento(
        peca_id=peca.id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        data=dados.data,
        ativo_id=dados.ativo_id,
        observacao=dados.observacao,
        registrado_por_id=usuario.id,
    )
    db.add(movimento)
    await db.commit()
    return peca


@router.get("/{peca_id}/movimentos", response_model=list[PecaMovimentoOut])
async def listar_movimentos(peca_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    result = await db.execute(
        select(PecaMovimento).where(PecaMovimento.peca_id == peca_id).order_by(PecaMovimento.data.desc())
    )
    return result.scalars().all()


@router.get("/historico/ativo/{ativo_id}", response_model=list[PecaMovimentoOut])
async def historico_por_ativo(ativo_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    """Lista as peças substituídas em um Ativo específico, mais recente primeiro."""
    result = await db.execute(
        select(PecaMovimento).where(PecaMovimento.ativo_id == ativo_id).order_by(PecaMovimento.data.desc())
    )
    return result.scalars().all()
