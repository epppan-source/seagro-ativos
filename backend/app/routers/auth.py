from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import LoginRequest, TokenResponse, TrocarSenhaRequest, SolicitarResetRequest, ConfirmarResetRequest
from app.services.auth_service import autenticar_funcionario, gerar_token_para_usuario
from app.services.senha_service import SenhaService
from app.models.funcionario import Funcionario

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest, db: AsyncSession = Depends(get_db)):
    usuario = await autenticar_funcionario(db, dados.login, dados.senha)
    token = gerar_token_para_usuario(usuario)
    return TokenResponse(
        access_token=token,
        deve_trocar_senha=usuario.deve_trocar_senha,
        nome_completo=usuario.nome_completo,
        role=usuario.role.value,
    )


@router.get("/me")
async def me(usuario: Funcionario = Depends(get_current_user)):
    return {
        "id": str(usuario.id), "nome_completo": usuario.nome_completo,
        "email": usuario.email, "role": usuario.role.value,
        "deve_trocar_senha": usuario.deve_trocar_senha,
    }


@router.post("/trocar-senha")
async def trocar_senha(dados: TrocarSenhaRequest, usuario: Funcionario = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await SenhaService(db).trocar_senha(usuario, dados.senha_atual, dados.nova_senha)


@router.post("/esqueci-senha")
async def esqueci_senha(dados: SolicitarResetRequest, db: AsyncSession = Depends(get_db)):
    return await SenhaService(db).solicitar_reset(dados.email)


@router.post("/redefinir-senha")
async def redefinir_senha(dados: ConfirmarResetRequest, db: AsyncSession = Depends(get_db)):
    return await SenhaService(db).confirmar_reset(dados.token, dados.nova_senha)


@router.get("/validar-token-reset/{token}")
async def validar_token_reset(token: str, db: AsyncSession = Depends(get_db)):
    usuario = await SenhaService(db).validar_token(token)
    return {"valido": True, "email": usuario.email}
