import time
import uuid
import cloudinary
import cloudinary.utils
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.manutencao_registro import ManutencaoRegistro
from app.models.funcionario import Funcionario
from app.schemas.manutencao_registro import ManutencaoRegistroCreate, ManutencaoRegistroOut
from app.config import settings

router = APIRouter(prefix="/api/ativos", tags=["manutencao_registros"])


def _cfg_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


@router.post("/{ativo_id}/manutencao-registros/assinar-upload")
async def assinar_upload(
    ativo_id: uuid.UUID,
    usuario: Funcionario = Depends(get_current_user),
):
    """Retorna parâmetros assinados para upload direto ao Cloudinary."""
    if not settings.CLOUDINARY_API_SECRET:
        raise HTTPException(status_code=503, detail="Cloudinary não configurado.")
    _cfg_cloudinary()
    timestamp = int(time.time())
    params_to_sign = {"folder": "seagro/manutencao", "timestamp": timestamp}
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_API_SECRET)
    return {
        "api_key": settings.CLOUDINARY_API_KEY,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "timestamp": timestamp,
        "signature": signature,
        "folder": "seagro/manutencao",
    }


@router.get("/{ativo_id}/manutencao-registros", response_model=list[ManutencaoRegistroOut])
async def listar(
    ativo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(get_current_user),
):
    result = await db.execute(
        select(ManutencaoRegistro)
        .options(selectinload(ManutencaoRegistro.usuario))
        .where(ManutencaoRegistro.ativo_id == ativo_id)
        .order_by(ManutencaoRegistro.data_hora.desc())
    )
    return result.scalars().all()


@router.post("/{ativo_id}/manutencao-registros", response_model=ManutencaoRegistroOut)
async def criar(
    ativo_id: uuid.UUID,
    dados: ManutencaoRegistroCreate,
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(get_current_user),
):
    agora = datetime.utcnow() - timedelta(hours=3)  # BRT
    registro = ManutencaoRegistro(
        ativo_id=ativo_id,
        usuario_id=usuario.id,
        data_hora=agora,
        video_url=dados.video_url,
        video_public_id=dados.video_public_id,
        descricao=dados.descricao,
        proxima_revisao=dados.proxima_revisao,
    )
    db.add(registro)

    # Atualiza data de revisão prevista no ativo se informada
    if dados.proxima_revisao:
        from app.models.ativo import Ativo
        ativo = await db.get(Ativo, ativo_id)
        if ativo:
            ativo.data_revisao_prevista = dados.proxima_revisao

    await db.commit()
    await db.refresh(registro)

    result = await db.execute(
        select(ManutencaoRegistro)
        .options(selectinload(ManutencaoRegistro.usuario))
        .where(ManutencaoRegistro.id == registro.id)
    )
    return result.scalars().one()


@router.delete("/{ativo_id}/manutencao-registros/{registro_id}", status_code=204)
async def excluir(
    ativo_id: uuid.UUID,
    registro_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    usuario: Funcionario = Depends(require_role("gestor")),
):
    registro = await db.get(ManutencaoRegistro, registro_id)
    if not registro or registro.ativo_id != ativo_id:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")
    await db.delete(registro)
    await db.commit()
