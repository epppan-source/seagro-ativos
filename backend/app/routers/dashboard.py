from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/resumo")
async def resumo(db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    return await DashboardService(db).resumo()
