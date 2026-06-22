import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.services.upload_service import salvar_upload
from app.models.ativo import AtivoFoto
from app.models.manutencao import ManutencaoFoto
from app.models.material import Material
from app.models.funcionario import Funcionario
from app.models.peca_reposicao import PecaReposicao

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/ativos/{ativo_id}/foto")
async def upload_foto_ativo(ativo_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    url = await salvar_upload(arquivo, "ativos")
    foto = AtivoFoto(ativo_id=ativo_id, url=url)
    db.add(foto)
    await db.commit()
    return {"url": url, "id": str(foto.id)}


@router.get("/ativos/{ativo_id}/fotos")
async def listar_fotos_ativo(ativo_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    resultado = await db.execute(
        select(AtivoFoto).where(AtivoFoto.ativo_id == ativo_id).order_by(AtivoFoto.created_at)
    )
    fotos = resultado.scalars().all()
    return [{"id": str(f.id), "url": f.url, "descricao": f.descricao} for f in fotos]


@router.delete("/ativos/fotos/{foto_id}")
async def remover_foto_ativo(foto_id: uuid.UUID, db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    foto = await db.get(AtivoFoto, foto_id)
    if not foto:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Foto não encontrada")
    await db.delete(foto)
    await db.commit()
    return {"ok": True}


@router.post("/manutencoes/{manutencao_id}/foto")
async def upload_foto_manutencao(manutencao_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    url = await salvar_upload(arquivo, "manutencoes")
    foto = ManutencaoFoto(manutencao_id=manutencao_id, url=url)
    db.add(foto)
    await db.commit()
    return {"url": url}


@router.post("/materiais/{material_id}/foto")
async def upload_foto_material(material_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material não encontrado")
    url = await salvar_upload(arquivo, "materiais")
    material.foto_url = url
    await db.commit()
    return {"url": url}


@router.post("/funcionarios/{funcionario_id}/foto")
async def upload_foto_funcionario(funcionario_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    funcionario = await db.get(Funcionario, funcionario_id)
    if not funcionario:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Funcionário não encontrado")
    url = await salvar_upload(arquivo, "funcionarios")
    funcionario.foto_url = url
    await db.commit()
    return {"url": url}


@router.post("/pecas/{peca_id}/foto")
async def upload_foto_peca(peca_id: uuid.UUID, arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db), usuario=Depends(get_current_user)):
    peca = await db.get(PecaReposicao, peca_id)
    if not peca:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Peça não encontrada")
    url = await salvar_upload(arquivo, "pecas")
    peca.foto_url = url
    await db.commit()
    return {"url": url}
