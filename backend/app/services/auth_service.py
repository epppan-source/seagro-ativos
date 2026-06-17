from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.funcionario import Funcionario
from app.utils.security import verificar_senha, criar_access_token


async def autenticar_funcionario(db: AsyncSession, login: str, senha: str) -> Funcionario:
    result = await db.execute(select(Funcionario).where(Funcionario.login == login))
    usuario = result.scalar_one_or_none()
    if not usuario or not usuario.ativo or not verificar_senha(senha, usuario.senha_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Login ou senha inválidos")
    return usuario


def gerar_token_para_usuario(usuario: Funcionario) -> str:
    return criar_access_token({"sub": str(usuario.id), "role": usuario.role.value})
