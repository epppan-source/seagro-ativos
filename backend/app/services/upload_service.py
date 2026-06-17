import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.config import settings

EXTENSOES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}


async def salvar_upload(arquivo: UploadFile, subpasta: str) -> str:
    ext = os.path.splitext(arquivo.filename)[1].lower()
    if ext not in EXTENSOES_PERMITIDAS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Formato de imagem não suportado")

    conteudo = await arquivo.read()
    if len(conteudo) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Arquivo excede o tamanho máximo permitido")

    pasta = os.path.join(settings.UPLOAD_DIR, subpasta)
    os.makedirs(pasta, exist_ok=True)
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    caminho = os.path.join(pasta, nome_arquivo)

    async with aiofiles.open(caminho, "wb") as f:
        await f.write(conteudo)

    return f"/static/uploads/{subpasta}/{nome_arquivo}"
