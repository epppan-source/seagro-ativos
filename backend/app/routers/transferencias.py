import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user, require_role
from app.schemas.transferencia import TransferenciaCreate, TransferenciaDecisao, TransferenciaOut
from app.models.transferencia import Transferencia
from app.models.funcionario import Funcionario
from app.services.transferencia_service import TransferenciaService

router = APIRouter(prefix="/api/transferencias", tags=["transferencias"])


@router.get("", response_model=list[TransferenciaOut])
async def listar(db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    result = await db.execute(select(Transferencia))
    return result.scalars().all()


@router.post("", response_model=TransferenciaOut)
async def solicitar(dados: TransferenciaCreate, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await TransferenciaService(db).solicitar(dados.ativo_id, usuario, dados.novo_responsavel_id, dados.motivo_solicitacao)


@router.post("/{transferencia_id}/decisao", response_model=TransferenciaOut, dependencies=[Depends(require_role("gestor"))])
async def decidir(transferencia_id: uuid.UUID, dados: TransferenciaDecisao, db: AsyncSession = Depends(get_db), usuario: Funcionario = Depends(get_current_user)):
    return await TransferenciaService(db).decidir(transferencia_id, usuario, dados.aprovar, dados.motivo_rejeicao)
