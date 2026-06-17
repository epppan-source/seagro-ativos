from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    return pwd_context.verify(senha_plana, senha_hash)

def gerar_hash_senha(senha_plana: str) -> str:
    return pwd_context.hash(senha_plana)

def criar_access_token(dados: dict) -> str:
    to_encode = dados.copy()
    expira = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
