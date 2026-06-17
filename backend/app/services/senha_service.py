import re
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.funcionario import Funcionario
from app.utils.security import verificar_senha, gerar_hash_senha
from app.services.email_service import EmailService


def _validar_senha(senha: str) -> None:
    if len(senha) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A senha deve ter no mínimo 8 caracteres")
    if not re.search(r"[A-Z]", senha):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A senha deve ter ao menos 1 letra maiúscula")
    if not re.search(r"[0-9]", senha):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A senha deve ter ao menos 1 número")


class SenhaService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def trocar_senha(self, usuario: Funcionario, senha_atual: str, nova_senha: str):
        if not verificar_senha(senha_atual, usuario.senha_hash):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Senha atual incorreta")
        _validar_senha(nova_senha)
        usuario.senha_hash = gerar_hash_senha(nova_senha)
        usuario.deve_trocar_senha = False
        await self.db.commit()
        return {"mensagem": "Senha alterada com sucesso"}

    async def solicitar_reset(self, email: str):
        result = await self.db.execute(select(Funcionario).where(Funcionario.email == email))
        usuario = result.scalar_one_or_none()
        if usuario:
            token = secrets.token_urlsafe(32)
            usuario.reset_token = token
            usuario.reset_token_expira_em = datetime.utcnow() + timedelta(hours=2)
            await self.db.commit()
            await EmailService().enviar_reset_senha(usuario.email, usuario.nome_completo, token)
        return {"mensagem": "Se o e-mail existir, enviaremos instruções de redefinição"}

    async def validar_token(self, token: str) -> Funcionario:
        result = await self.db.execute(select(Funcionario).where(Funcionario.reset_token == token))
        usuario = result.scalar_one_or_none()
        if not usuario or not usuario.reset_token_expira_em or usuario.reset_token_expira_em < datetime.utcnow():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Token inválido ou expirado")
        return usuario

    async def confirmar_reset(self, token: str, nova_senha: str):
        usuario = await self.validar_token(token)
        _validar_senha(nova_senha)
        usuario.senha_hash = gerar_hash_senha(nova_senha)
        usuario.deve_trocar_senha = False
        usuario.reset_token = None
        usuario.reset_token_expira_em = None
        await self.db.commit()
        return {"mensagem": "Senha redefinida com sucesso"}
