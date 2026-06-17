from pydantic import BaseModel, EmailStr, field_validator
import uuid

class LoginRequest(BaseModel):
    login: str
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    deve_trocar_senha: bool = False
    nome_completo: str
    role: str

class TrocarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str
    confirmar_senha: str

    @field_validator("confirmar_senha")
    @classmethod
    def senhas_devem_coincidir(cls, v, info):
        if "nova_senha" in info.data and v != info.data["nova_senha"]:
            raise ValueError("As senhas não coincidem")
        return v

class SolicitarResetRequest(BaseModel):
    email: EmailStr

class ConfirmarResetRequest(BaseModel):
    token: str
    nova_senha: str
    confirmar_senha: str

    @field_validator("confirmar_senha")
    @classmethod
    def senhas_devem_coincidir(cls, v, info):
        if "nova_senha" in info.data and v != info.data["nova_senha"]:
            raise ValueError("As senhas não coincidem")
        return v
