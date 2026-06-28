import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.funcionario import RoleFuncionario

class FuncionarioBase(BaseModel):
    nome_completo: str
    cpf: str
    cargo: str
    telefone: str | None = None
    email: EmailStr
    role: RoleFuncionario = RoleFuncionario.funcionario

class FuncionarioCreate(FuncionarioBase):
    login: str
    senha_provisoria: str

class FuncionarioUpdate(BaseModel):
    nome_completo: str | None = None
    cargo: str | None = None
    telefone: str | None = None
    email: EmailStr | None = None
    role: RoleFuncionario | None = None
    ativo: bool | None = None

class FuncionarioOut(FuncionarioBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    login: str
    ativo: bool
    foto_url: str | None = None
    deve_trocar_senha: bool
    created_at: datetime
