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
from app.models.funcionario import Funcionario, RoleFuncionario
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


@app.get("/api/setup/seed-admin")
async def seed_admin(secret: str, db: AsyncSession = Depends(get_db)):
    if secret != "R_yH0RM5CXUe4mvKBBYsvJQLOFCgeaQ_":
        raise HTTPException(status_code=403, detail="Secret inválido")

    existente = await db.execute(select(Funcionario).where(Funcionario.login == "pancini"))
    if existente.scalar_one_or_none():
        return {"created": False, "message": "Usuário 'pancini' já existe."}

    gestor = Funcionario(
        nome_completo="Eduardo Pancini",
        cpf="00000000000",
        cargo="Proprietário",
        email="pancini@seagro.com.br",
        login="pancini",
        senha_hash=gerar_hash_senha("Seagro@2026"),
        role=RoleFuncionario.gestor,
        deve_trocar_senha=True,
    )
    db.add(gestor)
    await db.commit()
    return {"created": True, "login": "pancini", "senha": "Seagro@2026"}
