from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.services.scheduler import iniciar_scheduler
from app.routers import auth, funcionarios, tipos, ativos, manutencoes, materiais, transferencias, dashboard, uploads


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
