from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.codigo import CodigoOut
from app.services.codigo_service import CodigoService

router = APIRouter(prefix="/api/codigos", tags=["codigos"])


@router.get("", response_model=list[CodigoOut])
async def listar(categoria: str | None = None, status_filtro: str | None = None, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    return await CodigoService(db).listar(categoria=categoria, status_filtro=status_filtro)


@router.get("/resumo")
async def resumo(db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    return await CodigoService(db).resumo()
