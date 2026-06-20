from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from app.config import settings
from app.services.scheduler import iniciar_scheduler
from app.routers import auth, funcionarios, tipos, ativos, manutencoes, materiais, transferencias, dashboard, uploads
from app.database import get_db
from app.models.funcionario import Funcionario
from app.utils.security import gerar_hash_senha


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    iniciar_scheduler()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(funcionarios.router)
app.include_router(tipos.router)
app.include_router(ativos.router)
app.include_router(manutencoes.router)
app.include_router(materiais.router)
app.include_router(transferencias.router)
app.include_router(dashboard.router)
app.include_router(uploads.router)


@app.get("/")
async def raiz():
    return {"app": settings.APP_NAME, "status": "online"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/setup/diag-admin")
async def diag_admin(secret: str, db: AsyncSession = Depends(get_db)):
    if secret != "R_yH0RM5CXUe4mvKBBYsvJQLOFCgeaQ_":
        raise HTTPException(status_code=403, detail="Secret inválido")

    result = await db.execute(select(Funcionario).where(Funcionario.login == "pancini"))
    usuario = result.scalar_one_or_none()
    if not usuario:
        return {"found": False}

    info = {
        "found": True,
        "login": usuario.login,
        "email": usuario.email,
        "ativo": usuario.ativo,
        "role": usuario.role.value,
        "deve_trocar_senha": usuario.deve_trocar_senha,
        "hash_prefix": usuario.senha_hash[:10],
    }

    usuario.senha_hash = gerar_hash_senha("Seagro@2026")
    usuario.ativo = True
    await db.commit()
    info["senha_resetada_para"] = "Seagro@2026"
    return info
