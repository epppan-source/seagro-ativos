import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.ativo import AtivoCreate, AtivoUpdate, AtivoOut
from app.models.funcionario import Funcionario
from app.services.ativo_service import AtivoService

router = APIRouter(prefix="/api/ativos", tags=["ativos"])


@router.get("", response_model=list[AtivoOut])
async def listar(categoria: str | None = None, status_filtro: str | None = None, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await AtivoService(db).listar(categoria=categoria, status_filtro=status_filtro)


@router.get("/{ativo_id}", response_model=AtivoOut)
async def buscar(ativo_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await AtivoService(db).buscar_por_id(ativo_id)


@router.post("", response_model=AtivoOut, dependencies=[Depends(require_role("gestor"))])
async def criar(dados: AtivoCreate, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await AtivoService(db).criar(dados.model_dump(), usuario.id)


@router.put("/{ativo_id}", response_model=AtivoOut, dependencies=[Depends(require_role("gestor"))])
async def atualizar(ativo_id: uuid.UUID, dados: AtivoUpdate, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await AtivoService(db).atualizar(ativo_id, dados.model_dump(exclude_unset=True), usuario.id)
