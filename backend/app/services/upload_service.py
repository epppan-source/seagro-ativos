import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from app.config import settings

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}

_cloudinary_configurado = False


def _cloudinary_disponivel() -> bool:
    return bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)


def _configurar_cloudinary():
    global _cloudinary_configurado
    if _cloudinary_configurado:
        return
    import cloudinary
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _cloudinary_configurado = True


def _upload_sincrono_cloudinary(conteudo: bytes, subpasta: str) -> str:
    import cloudinary.uploader
    _configurar_cloudinary()
    resultado = cloudinary.uploader.upload(
        conteudo,
        folder=f"seagro-ativos/{subpasta}",
        public_id=str(uuid.uuid4()),
        overwrite=True,
        resource_type="image",
    )
    return resultado["secure_url"]


async def salvar_upload(arquivo: UploadFile, subpasta: str) -> str:
    """Salva a imagem enviada. Usa Cloudinary se configurado (persistente entre deploys
    do Railway); caso contrário, cai para disco local (perdido a cada novo deploy)."""
    ext = os.path.splitext(arquivo.filename)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Formato de imagem não suportado")

    conteudo = await arquivo.read()
    if len(conteudo) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Arquivo excede o tamanho máximo permitido")

    if _cloudinary_disponivel():
        return await run_in_threadpool(_upload_sincrono_cloudinary, conteudo, subpasta)

    return await _salvar_local(conteudo, ext, subpasta)


async def _salvar_local(conteudo: bytes, ext: str, subpasta: str) -> str:
    pasta = os.path.join(settings.UPLOAD_DIR, subpasta)
    os.makedirs(pasta, exist_ok=True)
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    caminho = os.path.join(pasta, nome_arquivo)

    async with aiofiles.open(caminho, "wb") as f:
        await f.write(conteudo)

    return f"/static/uploads/{subpasta}/{nome_arquivo}"
