import uuid
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.services.upload_service import salvar_upload
from app.models.ativo import AtivoFoto
from app.models.manutencao import ManutencaoFoto

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/ativos/{ativo_id}/foto")
async def upload_foto_ativo(ativo_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    url = await salvar_upload(arquivo, "ativos")
    foto = AtivoFoto(ativo_id=ativo_id, url=url)
    db.add(foto)
    await db.commit()
    return {"url": url}


@router.post("/manutencoes/{manutencao_id}/foto")
async def upload_foto_manutencao(manutencao_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    url = await salvar_upload(arquivo, "manutencoes")
    foto = ManutencaoFoto(manutencao_id=manutencao_id, url=url)
    db.add(foto)
    await db.commit()
    return {"url": url}
