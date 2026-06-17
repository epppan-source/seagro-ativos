import os
import uuid
import qrcode
from app.config import settings


def gerar_qrcode_ativo(ativo_id: uuid.UUID, codigo_interno: str) -> str:
    url = f"{settings.APP_URL}/ativos/{ativo_id}"
    img = qrcode.make(url)
    pasta = os.path.join(settings.UPLOAD_DIR, "qrcodes")
    os.makedirs(pasta, exist_ok=True)
    caminho = os.path.join(pasta, f"{codigo_interno}.png")
    img.save(caminho)
    return f"/static/uploads/qrcodes/{codigo_interno}.png"
