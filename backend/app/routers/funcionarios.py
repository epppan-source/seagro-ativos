import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.models.funcionario import Funcionario, RoleFuncionario
from app.schemas.funcionario import FuncionarioCreate, FuncionarioUpdate, FuncionarioOut
from app.utils.security import gerar_hash_senha
from app.services.senha_service import _validar_senha

router = APIRouter(prefix="/api/funcionarios", tags=["funcionarios"])


@router.get("", response_model=list[FuncionarioOut])
async def listar(db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    result = await db.execute(select(Funcionario).where(Funcionario.ativo == True))
    return result.scalars().all()


@router.post("", response_model=FuncionarioOut, dependencies=[Depends(require_role("gestor"))])
async def criar(dados: FuncionarioCreate, db: AsyncSession = Depends(get_db)):
    existente = await db.execute(select(Funcionario).where(
        (Funcionario.login == dados.login) | (Funcionario.cpf == dados.cpf) | (Funcionario.email == dados.email)
    ))
    if existente.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Login, CPF ou e-mail já cadastrado")

    _validar_senha(dados.senha_provisoria)
    novo = Funcionario(
        **dados.model_dump(exclude={"role", "senha_provisoria"}),
        role=dados.role,
        senha_hash=gerar_hash_senha(dados.senha_provisoria),
        deve_trocar_senha=True,
    )
    db.add(novo)
    await db.commit()
    return novo


@router.put("/{funcionario_id}", response_model=FuncionarioOut, dependencies=[Depends(require_role("gestor"))])
async def atualizar(funcionario_id: uuid.UUID, dados: FuncionarioUpdate, db: AsyncSession = Depends(get_db)):
    funcionario = await db.get(Funcionario, funcionario_id)
    if not funcionario:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Funcionário não encontrado")
    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(funcionario, campo, valor)
    await db.commit()
    return funcionario
