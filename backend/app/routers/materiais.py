import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut, MaterialMovimento
from app.models.material import Material

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
async def movimentar(material_id: uuid.UUID, dados: MaterialMovimento, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material não encontrado")
    if dados.tipo == "ENTRADA":
        material.quantidade_atual += dados.quantidade
    elif dados.tipo == "SAIDA":
        if material.quantidade_atual < dados.quantidade:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quantidade insuficiente em estoque")
        material.quantidade_atual -= dados.quantidade
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Tipo de movimento inválido")
    await db.commit()
    return material
