import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialOut,
    MaterialMovimentoCreate, MaterialMovimentoOut,
)
from app.models.material import Material, MaterialMovimento
from app.models.ativo import Ativo

router = APIRouter(prefix="/api/materiais", tags=["materiais"])


@router.get("", response_model=list[MaterialOut])
async def listar(db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    result = await db.execute(select(Material).where(Material.ativo == True))
    return result.scalars().all()


@router.post("", response_model=MaterialOut, dependencies=[Depends(require_role("gestor"))])
async def criar(dados: MaterialCreate, db: AsyncSession = Depends(get_db)):
    novo = Material(**dados.model_dump())
    db.add(novo)
    await db.commit()
    return novo


@router.put("/{material_id}", response_model=MaterialOut, dependencies=[Depends(require_role("gestor"))])
async def atualizar(material_id: uuid.UUID, dados: MaterialUpdate, db: AsyncSession = Depends(get_db)):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material não encontrado")
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(material, campo, valor)
    await db.commit()
    return material


@router.post("/{material_id}/movimento", response_model=MaterialOut)
async def movimentar(
    material_id: uuid.UUID,
    dados: MaterialMovimentoCreate,
    db: AsyncSession = Depends(get_db),
    usuario=Depends(get_current_user),
):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material não encontrado")

    if dados.ativo_id is not None:
        ativo = await db.get(Ativo, dados.ativo_id)
        if not ativo:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ativo informado não encontrado")

    if dados.tipo == "ENTRADA":
        material.quantidade_atual += dados.quantidade
    elif dados.tipo == "SAIDA":
        if material.quantidade_atual < dados.quantidade:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quantidade insuficiente em estoque")
        material.quantidade_atual -= dados.quantidade

    movimento = MaterialMovimento(
        material_id=material.id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        data=dados.data,
        ativo_id=dados.ativo_id,
        observacao=dados.observacao,
        registrado_por_id=usuario.id,
    )
    db.add(movimento)
    await db.commit()
    return material


@router.get("/{material_id}/movimentos", response_model=list[MaterialMovimentoOut])
async def listar_movimentos(material_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    result = await db.execute(
        select(MaterialMovimento)
        .where(MaterialMovimento.material_id == material_id)
        .order_by(MaterialMovimento.data.desc())
    )
    return result.scalars().all()


@router.get("/historico/ativo/{ativo_id}", response_model=list[MaterialMovimentoOut])
async def historico_por_ativo(ativo_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    """Lista os materiais utilizados em um Ativo específico, mais recente primeiro."""
    result = await db.execute(
        select(MaterialMovimento)
        .where(MaterialMovimento.ativo_id == ativo_id)
        .order_by(MaterialMovimento.data.desc())
    )
    return result.scalars().all()
